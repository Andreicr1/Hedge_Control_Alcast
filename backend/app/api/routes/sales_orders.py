from typing import List
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models
from app.schemas import SalesOrderCreate, SalesOrderRead, SalesOrderUpdate
from app.api.deps import require_roles

router = APIRouter(prefix="/sales-orders", tags=["sales_orders"])


def _generate_so_number() -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    suffix = uuid4().hex[:6].upper()
    return f"SO-{ts}-{suffix}"


@router.get("", response_model=List[SalesOrderRead])
def list_sales_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.vendas)),
):
    return (
        db.query(models.SalesOrder)
        .options(joinedload(models.SalesOrder.customer))
        .order_by(models.SalesOrder.created_at.desc())
        .all()
    )


@router.post("", response_model=SalesOrderRead, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.vendas)),
):
    customer = db.get(models.Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found")

    so_number = payload.so_number or _generate_so_number()

    so = models.SalesOrder(
        so_number=so_number,
        customer_id=payload.customer_id,
        product=payload.product,
        total_quantity_mt=payload.total_quantity_mt,
        unit=payload.unit,
        unit_price=payload.unit_price,
        pricing_type=payload.pricing_type,
        pricing_period=payload.pricing_period,
        lme_premium=payload.lme_premium,
        premium=payload.premium,
        reference_price=payload.reference_price,
        fixing_deadline=payload.fixing_deadline,
        expected_delivery_date=payload.expected_delivery_date,
        location=payload.location,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(so)
    db.flush()

    exposure = models.Exposure(
        source_type=models.MarketObjectType.so,
        source_id=so.id,
        exposure_type=models.ExposureType.active,
        quantity_mt=so.total_quantity_mt,
        product=so.product,
        payment_date=None,
        delivery_date=so.expected_delivery_date,
        sale_date=None,
    )
    db.add(exposure)
    db.flush()
    task = models.HedgeTask(exposure_id=exposure.id)
    db.add(task)

    db.commit()
    db.refresh(so)
    return so


@router.get("/{so_id}", response_model=SalesOrderRead)
def get_sales_order(
    so_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.vendas)),
):
    so = (
        db.query(models.SalesOrder)
        .options(joinedload(models.SalesOrder.customer))
        .filter(models.SalesOrder.id == so_id)
        .first()
    )
    if not so:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sales Order not found")
    return so


@router.put("/{so_id}", response_model=SalesOrderRead)
def update_sales_order(
    so_id: int,
    payload: SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.vendas)),
):
    so = db.get(models.SalesOrder, so_id)
    if not so:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sales Order not found")

    data = payload.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(so, field, value)

    db.add(so)
    db.commit()
    db.refresh(so)
    return so


@router.delete("/{so_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sales_order(
    so_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.vendas)),
):
    so = db.get(models.SalesOrder, so_id)
    if not so:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sales Order not found")
    db.delete(so)
    db.commit()
