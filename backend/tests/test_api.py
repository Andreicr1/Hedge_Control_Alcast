import os

os.environ.setdefault("SECRET_KEY", "test-secret-key-1234567890")
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.main import app
from app.api import deps
from app import models
from app.models.domain import RoleName


engine = create_engine(os.environ["DATABASE_URL"], connect_args={"check_same_thread": False}, future=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[deps.get_db] = override_get_db


def get_admin_user():
    class StubUser:
        def __init__(self):
            self.id = 1
            self.email = "admin@test.com"
            self.active = True
            self.role = type("Role", (), {"name": RoleName.admin})()

    return StubUser()


client = TestClient(app)


def test_auth_signup_and_token():
    resp = client.post(
        "/auth/signup",
        json={"email": "user@test.com", "name": "User", "password": "secret123", "role": "admin"},
    )
    assert resp.status_code == 201

    token_resp = client.post(
        "/auth/token", data={"username": "user@test.com", "password": "secret123"}, headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert token_resp.status_code == 200
    access = token_resp.json()["access_token"]
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "user@test.com"


def test_purchase_order_creation_and_validation():
    app.dependency_overrides[deps.get_current_user] = lambda: get_admin_user()
    # create supplier
    sup_resp = client.post(
        "/suppliers",
        json={"name": "Fornecedor", "code": "F1", "contact_email": "f@f.com", "contact_phone": "123"},
    )
    assert sup_resp.status_code == 201
    sup_id = sup_resp.json()["id"]

    po_resp = client.post(
        "/purchase-orders",
        json={
            "supplier_id": sup_id,
            "product": "Alumínio",
            "total_quantity_mt": 10,
            "unit": "MT",
            "unit_price": 2000,
            "pricing_type": "fixed",
            "lme_premium": 0,
        },
    )
    assert po_resp.status_code == 201
    body = po_resp.json()
    assert body["po_number"]
    # validation error
    bad_resp = client.post(
        "/purchase-orders",
        json={
            "supplier_id": sup_id,
            "product": "Alumínio",
            "total_quantity_mt": -1,
            "unit": "MT",
            "pricing_type": "fixed",
            "lme_premium": 0,
        },
    )
    assert bad_resp.status_code == 422
    app.dependency_overrides.pop(deps.get_current_user, None)


def test_sales_order_creation_and_validation():
    app.dependency_overrides[deps.get_current_user] = lambda: get_admin_user()
    cust_resp = client.post(
        "/customers",
        json={"name": "Cliente", "code": "C1", "contact_email": "c@c.com", "contact_phone": "321"},
    )
    assert cust_resp.status_code == 201
    cust_id = cust_resp.json()["id"]

    so_resp = client.post(
        "/sales-orders",
        json={
            "customer_id": cust_id,
            "product": "Alumínio",
            "total_quantity_mt": 5,
            "unit": "MT",
            "unit_price": 2500,
            "pricing_type": "fixed",
            "lme_premium": 0,
        },
    )
    assert so_resp.status_code == 201
    assert so_resp.json()["so_number"]

    bad_resp = client.post(
        "/sales-orders",
        json={
            "customer_id": cust_id,
            "product": "Alumínio",
            "total_quantity_mt": -10,
            "pricing_type": "fixed",
            "lme_premium": 0,
        },
    )
    assert bad_resp.status_code == 422
    app.dependency_overrides.pop(deps.get_current_user, None)


def test_counterparty_crud():
    app.dependency_overrides[deps.get_current_user] = lambda: get_admin_user()
    resp = client.post(
        "/counterparties",
        json={"name": "Banco X", "type": "bank", "contact_email": "b@x.com"},
    )
    assert resp.status_code == 201
    list_resp = client.get("/counterparties")
    assert list_resp.status_code == 200
    assert any(cp["name"] == "Banco X" for cp in list_resp.json())
    app.dependency_overrides.pop(deps.get_current_user, None)


def test_rfq_preview():
    app.dependency_overrides[deps.get_current_user] = lambda: get_admin_user()
    payload = {
        "trade_type": "Swap",
        "leg1": {
          "side": "buy",
          "price_type": "AVG",
          "quantity_mt": 10,
          "month_name": "January",
          "year": 2025
        },
        "leg2": {
          "side": "sell",
          "price_type": "Fix",
          "quantity_mt": 10,
          "fixing_date": "2025-01-15"
        },
        "sync_ppt": False,
        "company_header": "Alcast",
        "company_label_for_payoff": "Alcast"
    }
    resp = client.post("/rfqs/preview", json=payload)
    assert resp.status_code == 200
    assert "How can I" in resp.json()["text"]
    app.dependency_overrides.pop(deps.get_current_user, None)

