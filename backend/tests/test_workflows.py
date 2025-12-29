from datetime import datetime, date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app import models
from app.api import deps

# Use isolated in-memory SQLite for tests (shared across connections)
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class _StubRole:
    def __init__(self, name):
        self.name = name


class _StubUser:
    def __init__(self, role_name, user_id=1):
        self.role = _StubRole(role_name)
        self.id = user_id


def override_get_current_user():
    return _StubUser(models.RoleName.admin)


app.dependency_overrides[deps.get_db] = override_get_db
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[deps.get_current_user] = override_get_current_user
app.dependency_overrides[deps.oauth2_scheme] = lambda: "testtoken"

client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)


def test_po_status_transitions():
    db = TestingSessionLocal()
    supplier = models.Supplier(name="Supp")
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    payload = {
        "code": "PO1",
        "supplier_id": supplier.id,
        "quantity_tons": 10,
        "aluminum_type": "A",
        "expected_delivery_date": None,
        "expected_payment_date": None,
        "payment_terms": None,
        "currency": "USD",
        "notes": None,
    }
    r = client.post("/api/purchase-orders", json=payload)
    assert r.status_code == 201
    po = r.json()

    r2 = client.post(f"/api/purchase-orders/{po['id']}/status", json={"status": "hedged"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "hedged"

    r3 = client.post(f"/api/purchase-orders/{po['id']}/status", json={"status": "draft"})
    assert r3.status_code == 400


def test_rfq_status_transitions():
    db = TestingSessionLocal()
    supplier = models.Supplier(name="Supp2")
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    po_payload = {
        "code": "PO2",
        "supplier_id": supplier.id,
        "quantity_tons": 5,
        "aluminum_type": "A",
        "expected_delivery_date": None,
        "expected_payment_date": None,
        "payment_terms": None,
        "currency": "USD",
        "notes": None,
    }
    po_r = client.post("/api/purchase-orders", json=po_payload)
    assert po_r.status_code == 201
    po = po_r.json()

    rfq_payload = {
        "rfq_type": "hedge_buy",
        "reference_po_id": po["id"],
        "reference_so_id": None,
        "tenor_month": "2025-01",
        "quantity_tons": 5,
        "channel": "api",
        "message_text": None,
        "generate_message": False,
        "preview_payload": None,
    }
    r = client.post("/api/rfqs", json=rfq_payload)
    assert r.status_code == 201
    rfq = r.json()

    r2 = client.post(f"/api/rfqs/{rfq['id']}/status", json={"status": "sent"})
    assert r2.status_code == 200
    r3 = client.post(f"/api/rfqs/{rfq['id']}/status", json={"status": "quoted"})
    assert r3.status_code == 200
    r4 = client.post(f"/api/rfqs/{rfq['id']}/status", json={"status": "draft"})
    assert r4.status_code == 400


def test_so_link_validation_and_duplicate_ids():
    db = TestingSessionLocal()
    supplier = models.Supplier(name="Supp3")
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    po1 = models.PurchaseOrder(
        code="POX",
        supplier_id=supplier.id,
        quantity_tons=5,
        aluminum_type="A",
        status=models.OrderStatus.submitted,
    )
    po2 = models.PurchaseOrder(
        code="POY",
        supplier_id=supplier.id,
        quantity_tons=5,
        aluminum_type="A",
        status=models.OrderStatus.settled,  # settled should be blocked
    )
    db.add_all([po1, po2])
    db.commit()
    db.refresh(po1)
    db.refresh(po2)

    payload = {
        "code": "SO1",
        "customer_id": 1,  # will fail if not present; create stub
        "quantity_tons": 5,
        "aluminum_type": "A",
        "expected_delivery_date": None,
        "expected_receipt_date": None,
        "receipt_terms": None,
        "currency": "USD",
        "notes": None,
        "linked_purchase_order_ids": [po1.id, po1.id],  # duplicate
    }
    # Create a customer stub to satisfy FK
    cust = models.Customer(name="Cust1")
    db.add(cust)
    db.commit()
    db.refresh(cust)
    payload["customer_id"] = cust.id

    r = client.post("/api/sales-orders", json=payload)
    assert r.status_code == 400

    # Now try linking to settled PO
    payload["linked_purchase_order_ids"] = [po2.id]
    r2 = client.post("/api/sales-orders", json=payload)
    assert r2.status_code == 400


def test_hedge_notional_aggregate_check():
    db = TestingSessionLocal()
    supplier = models.Supplier(name="Supp4")
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    po = models.PurchaseOrder(
        code="POZ",
        supplier_id=supplier.id,
        quantity_tons=100,
        aluminum_type="A",
        status=models.OrderStatus.submitted,
    )
    db.add(po)
    db.commit()
    db.refresh(po)

    # seed a market price so hedges can be created without pricing errors elsewhere
    db.add(models.MarketPrice(source="LME", symbol="LME-ALU", price=2300, currency="USD", as_of=datetime.utcnow()))
    db.commit()

    hedge1 = {
        "hedge_type": "purchase",
        "side": "buy",
        "lme_contract": "LME-ALU",
        "contract_month": "2025-01",
        "expiry_date": None,
        "lots": 2,
        "lot_size_tons": 25.0,
        "price": 2200.0,
        "currency": "USD",
        "notional_tons": 90.0,
        "purchase_order_id": po.id,
        "sales_order_id": None,
        "rfq_id": None,
    }
    r = client.post("/api/hedges", json=hedge1)
    assert r.status_code == 201

    hedge2 = hedge1.copy()
    hedge2["notional_tons"] = 30.0  # aggregate 120 > 110% of 100
    r2 = client.post("/api/hedges", json=hedge2)
    assert r2.status_code == 400


def test_inventory_filters_and_export():
    db = TestingSessionLocal()
    supplier = models.Supplier(name="Supp5")
    location = models.WarehouseLocation(name="Santos")
    db.add_all([supplier, location])
    db.commit()
    db.refresh(supplier)
    db.refresh(location)

    customer = models.Customer(name="CustInv")
    db.add(customer)
    db.commit()
    db.refresh(customer)

    po = models.PurchaseOrder(
        code="PO_INV",
        supplier_id=supplier.id,
        quantity_tons=100,
        aluminum_type="P1020",
        status=models.OrderStatus.submitted,
        location_id=location.id,
        avg_cost=2100.5,
        arrival_date=date(2024, 1, 15),
    )
    so = models.SalesOrder(
        code="SO_INV",
        customer_id=customer.id,
        quantity_tons=20,
        aluminum_type="P1020",
        status=models.OrderStatus.submitted,
        location_id=location.id,
    )
    db.add_all([po, so])
    db.commit()
    db.refresh(po)
    db.refresh(so)
    db.add(models.SoPoLink(sales_order_id=so.id, purchase_order_id=po.id, link_ratio=None))
    db.commit()

    r = client.get("/api/inventory?location=Santos&min_available_tons=50")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["location"] == "Santos"
    assert items[0]["available_tons"] == 80

    r_csv = client.get("/api/inventory?export=csv")
    assert r_csv.status_code == 200
    assert "text/csv" in r_csv.headers.get("content-type", "")


def test_rfq_export_endpoint():
    db = TestingSessionLocal()
    supplier = models.Supplier(name="Supp6")
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    po = models.PurchaseOrder(
        code="PO_RFQ",
        supplier_id=supplier.id,
        quantity_tons=50,
        aluminum_type="Billet",
        status=models.OrderStatus.submitted,
    )
    db.add(po)
    db.commit()
    db.refresh(po)

    rfq = models.Rfq(
        rfq_type=models.RfqType.hedge_buy,
        reference_po_id=po.id,
        reference_so_id=None,
        tenor_month="2025-02",
        quantity_tons=10,
        channel="api",
        status=models.RfqStatus.sent,
        message_text="Test",
    )
    db.add(rfq)
    db.commit()
    db.refresh(rfq)

    quote = models.RfqQuote(rfq_id=rfq.id, provider="BankA", price=123.4, currency="USD", selected=False)
    attempt = models.RfqSendAttempt(
        rfq_id=rfq.id,
        channel="api",
        status=models.SendStatus.sent,
        metadata_json='{"counterparty_name": "BankA"}',
    )
    db.add_all([quote, attempt])
    db.commit()

    r = client.get("/api/reports/rfq-export?counterparty=BankA")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1
    assert any(row["provider"] == "BankA" for row in data)

    r_csv = client.get("/api/reports/rfq-export?format=csv")
    assert r_csv.status_code == 200
    assert "text/csv" in r_csv.headers.get("content-type", "")
