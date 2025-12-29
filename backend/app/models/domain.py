from datetime import datetime, date
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RoleName(PyEnum):
    admin = "admin"
    compras = "compras"
    vendas = "vendas"
    financeiro = "financeiro"
    estoque = "estoque"


class OrderStatus(PyEnum):
    draft = "draft"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class PricingType(PyEnum):
    fixed = "fixed"
    tbf = "tbf"
    monthly_average = "monthly_average"
    lme_premium = "lme_premium"


class CounterpartyType(PyEnum):
    bank = "bank"
    broker = "broker"


class DocumentOwnerType(PyEnum):
    customer = "customer"
    supplier = "supplier"


class RfqStatus(PyEnum):
    draft = "draft"
    pending = "pending"
    sent = "sent"
    quoted = "quoted"
    awarded = "awarded"
    expired = "expired"
    failed = "failed"


class HedgeStatus(PyEnum):
    active = "active"
    closed = "closed"
    cancelled = "cancelled"


class SendStatus(PyEnum):
    queued = "queued"
    sent = "sent"
    failed = "failed"


class MarketObjectType(PyEnum):
    hedge = "hedge"
    po = "po"
    so = "so"
    portfolio = "portfolio"
    exposure = "exposure"
    net = "net"


class ExposureType(PyEnum):
    active = "active"   # risco de queda (derivado de SO)
    passive = "passive"  # risco de alta (derivado de PO)


class ExposureStatus(PyEnum):
    open = "open"
    partially_hedged = "partially_hedged"
    hedged = "hedged"
    closed = "closed"


class HedgeTaskStatus(PyEnum):
    pending = "pending"
    in_progress = "in_progress"
    hedged = "hedged"
    completed = "completed"
    cancelled = "cancelled"


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[RoleName] = mapped_column(Enum(RoleName), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    role = relationship("Role", back_populates="users")


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    code: Mapped[str | None] = mapped_column(String(32), unique=True)
    legal_name: Mapped[str | None] = mapped_column(String(255))
    tax_id: Mapped[str | None] = mapped_column(String(32))
    state_registration: Mapped[str | None] = mapped_column(String(64))
    address_line: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(128))
    state: Mapped[str | None] = mapped_column(String(8))
    postal_code: Mapped[str | None] = mapped_column(String(32))
    credit_limit: Mapped[float | None] = mapped_column(Float)
    credit_score: Mapped[int | None] = mapped_column(Integer)
    kyc_status: Mapped[str | None] = mapped_column(String(32), default="pending")
    kyc_notes: Mapped[str | None] = mapped_column(Text)
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(64))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    documents = relationship("KycDocument", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    code: Mapped[str | None] = mapped_column(String(32), unique=True)
    legal_name: Mapped[str | None] = mapped_column(String(255))
    tax_id: Mapped[str | None] = mapped_column(String(32))
    state_registration: Mapped[str | None] = mapped_column(String(64))
    address_line: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(128))
    state: Mapped[str | None] = mapped_column(String(8))
    postal_code: Mapped[str | None] = mapped_column(String(32))
    credit_limit: Mapped[float | None] = mapped_column(Float)
    credit_score: Mapped[int | None] = mapped_column(Integer)
    kyc_status: Mapped[str | None] = mapped_column(String(32), default="pending")
    kyc_notes: Mapped[str | None] = mapped_column(Text)
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(64))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    documents = relationship("KycDocument", back_populates="customer")
    sales_orders = relationship("SalesOrder", back_populates="customer")


class WarehouseLocation(Base):
    __tablename__ = "warehouse_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    type: Mapped[str | None] = mapped_column(String(64))
    current_stock_mt: Mapped[float | None] = mapped_column(Float)
    capacity_mt: Mapped[float | None] = mapped_column(Float)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    po_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), nullable=False)
    product: Mapped[str | None] = mapped_column(String(255))
    total_quantity_mt: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str | None] = mapped_column(String(16), default="MT")
    unit_price: Mapped[float | None] = mapped_column(Float)
    pricing_type: Mapped[PricingType] = mapped_column(Enum(PricingType), default=PricingType.monthly_average, nullable=False)
    pricing_period: Mapped[str | None] = mapped_column(String(32))
    lme_premium: Mapped[float] = mapped_column(Float, default=0.0)
    premium: Mapped[float | None] = mapped_column(Float)
    reference_price: Mapped[str | None] = mapped_column(String(64))
    fixing_deadline: Mapped[Date | None] = mapped_column(Date)
    expected_delivery_date: Mapped[Date | None] = mapped_column(Date)
    location: Mapped[str | None] = mapped_column(String(128))
    avg_cost: Mapped[float | None] = mapped_column(Float)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.draft, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    supplier = relationship("Supplier", back_populates="purchase_orders")
    exposures = relationship("Exposure", back_populates="purchase_order")


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    so_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    product: Mapped[str | None] = mapped_column(String(255))
    total_quantity_mt: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str | None] = mapped_column(String(16), default="MT")
    unit_price: Mapped[float | None] = mapped_column(Float)
    pricing_type: Mapped[PricingType] = mapped_column(Enum(PricingType), default=PricingType.monthly_average, nullable=False)
    pricing_period: Mapped[str | None] = mapped_column(String(32))
    lme_premium: Mapped[float] = mapped_column(Float, default=0.0)
    premium: Mapped[float | None] = mapped_column(Float)
    reference_price: Mapped[str | None] = mapped_column(String(64))
    fixing_deadline: Mapped[Date | None] = mapped_column(Date)
    expected_delivery_date: Mapped[Date | None] = mapped_column(Date)
    location: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.draft, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="sales_orders")
    rfqs = relationship("Rfq", back_populates="sales_order")
    hedges = relationship("Hedge", back_populates="sales_order")
    exposures = relationship("Exposure", back_populates="sales_order")


class Counterparty(Base):
    __tablename__ = "counterparties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    type: Mapped[CounterpartyType] = mapped_column(Enum(CounterpartyType), nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String(255))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(64))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    hedges = relationship("Hedge", back_populates="counterparty")
    quotes = relationship("RfqQuote", back_populates="counterparty")


class Rfq(Base):
    __tablename__ = "rfqs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rfq_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    so_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"), nullable=False)
    quantity_mt: Mapped[float] = mapped_column(Float, nullable=False)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[RfqStatus] = mapped_column(Enum(RfqStatus), default=RfqStatus.pending, nullable=False)
    message_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sales_order = relationship("SalesOrder", back_populates="rfqs")
    counterparty_quotes = relationship("RfqQuote", back_populates="rfq", cascade="all, delete-orphan")


class RfqQuote(Base):
    __tablename__ = "rfq_quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rfq_id: Mapped[int] = mapped_column(ForeignKey("rfqs.id"), nullable=False)
    counterparty_id: Mapped[int | None] = mapped_column(ForeignKey("counterparties.id"))
    counterparty_name: Mapped[str | None] = mapped_column(String(255))
    quote_price: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="quoted")
    quoted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    rfq = relationship("Rfq", back_populates="counterparty_quotes")
    counterparty = relationship("Counterparty", back_populates="quotes")


class Hedge(Base):
    __tablename__ = "hedges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    so_id: Mapped[int | None] = mapped_column(ForeignKey("sales_orders.id"))
    counterparty_id: Mapped[int] = mapped_column(ForeignKey("counterparties.id"), nullable=False)
    quantity_mt: Mapped[float] = mapped_column(Float, nullable=False)
    contract_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_market_price: Mapped[float | None] = mapped_column(Float)
    mtm_value: Mapped[float | None] = mapped_column(Float)
    period: Mapped[str] = mapped_column(String(20), nullable=False)
    instrument: Mapped[str | None] = mapped_column(String(128))
    maturity_date: Mapped[Date | None] = mapped_column(Date)
    reference_code: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[HedgeStatus] = mapped_column(Enum(HedgeStatus), default=HedgeStatus.active, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sales_order = relationship("SalesOrder", back_populates="hedges")
    counterparty = relationship("Counterparty", back_populates="hedges")
    exposure_links = relationship("HedgeExposure", back_populates="hedge", cascade="all, delete-orphan")


class KycDocument(Base):
    __tablename__ = "kyc_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    owner_type: Mapped[DocumentOwnerType] = mapped_column(Enum(DocumentOwnerType), nullable=False)
    owner_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(128))
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    metadata_json: Mapped[dict | None] = mapped_column(JSON)

    customer = relationship(
        "Customer",
        back_populates="documents",
        primaryjoin="and_(KycDocument.owner_id==Customer.id, KycDocument.owner_type=='customer')",
        viewonly=True,
    )
    supplier = relationship(
        "Supplier",
        back_populates="documents",
        primaryjoin="and_(KycDocument.owner_id==Supplier.id, KycDocument.owner_type=='supplier')",
        viewonly=True,
    )


class CreditCheck(Base):
    __tablename__ = "credit_checks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    owner_type: Mapped[DocumentOwnerType] = mapped_column(Enum(DocumentOwnerType), nullable=False)
    owner_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    bureau: Mapped[str] = mapped_column(String(128))
    score: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(64))
    raw_response: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MtmRecord(Base):
    __tablename__ = "mtm_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    as_of_date: Mapped[Date] = mapped_column(Date, nullable=False)
    object_type: Mapped[MarketObjectType] = mapped_column(Enum(MarketObjectType), nullable=False)
    object_id: Mapped[int | None] = mapped_column(Integer)
    forward_price: Mapped[float | None] = mapped_column(Float)
    fx_rate: Mapped[float | None] = mapped_column(Float)
    mtm_value: Mapped[float] = mapped_column(Float, nullable=False)
    methodology: Mapped[str | None] = mapped_column(String(128))
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    symbol: Mapped[str] = mapped_column(String(64), nullable=False)
    contract_month: Mapped[str | None] = mapped_column(String(16))
    price: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    as_of: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    fx: Mapped[bool] = mapped_column(Boolean, default=False)


class Exposure(Base):
    __tablename__ = "exposures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_type: Mapped[MarketObjectType] = mapped_column(Enum(MarketObjectType), nullable=False)
    source_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    exposure_type: Mapped[ExposureType] = mapped_column(Enum(ExposureType), nullable=False)
    quantity_mt: Mapped[float] = mapped_column(Float, nullable=False)
    product: Mapped[str | None] = mapped_column(String(255))
    payment_date: Mapped[Date | None] = mapped_column(Date)
    delivery_date: Mapped[Date | None] = mapped_column(Date)
    sale_date: Mapped[Date | None] = mapped_column(Date)
    status: Mapped[ExposureStatus] = mapped_column(Enum(ExposureStatus), default=ExposureStatus.open, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    purchase_order = relationship(
        "PurchaseOrder",
        back_populates="exposures",
        primaryjoin="and_(Exposure.source_id==PurchaseOrder.id, Exposure.source_type=='po')",
        viewonly=True,
    )
    sales_order = relationship(
        "SalesOrder",
        back_populates="exposures",
        primaryjoin="and_(Exposure.source_id==SalesOrder.id, Exposure.source_type=='so')",
        viewonly=True,
    )
    tasks = relationship("HedgeTask", back_populates="exposure", cascade="all, delete-orphan")
    hedge_links = relationship("HedgeExposure", back_populates="exposure", cascade="all, delete-orphan")


class HedgeTask(Base):
    __tablename__ = "hedge_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    exposure_id: Mapped[int] = mapped_column(ForeignKey("exposures.id"), nullable=False)
    status: Mapped[HedgeTaskStatus] = mapped_column(Enum(HedgeTaskStatus), default=HedgeTaskStatus.pending, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    exposure = relationship("Exposure", back_populates="tasks")


class HedgeExposure(Base):
    __tablename__ = "hedge_exposures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    hedge_id: Mapped[int] = mapped_column(ForeignKey("hedges.id"), nullable=False)
    exposure_id: Mapped[int] = mapped_column(ForeignKey("exposures.id"), nullable=False)
    quantity_mt: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    hedge = relationship("Hedge", back_populates="exposure_links")
    exposure = relationship("Exposure", back_populates="hedge_links")
