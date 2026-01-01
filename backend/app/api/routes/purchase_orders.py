from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models
from app.schemas import PurchaseOrderCreate, PurchaseOrderRead, PurchaseOrderUpdate
from app.api.deps import require_roles
from app.services.deal_engine import link_purchase_order_to_deal

router = APIRouter(prefix="/purchase-orders", tags=["purchase_orders"])


def _generate_po_number() -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"PO-{ts}"


@router.get("", response_model=List[PurchaseOrderRead])
def list_purchase_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.compras)),
):
    return (
        db.query(models.PurchaseOrder)
        .options(joinedload(models.PurchaseOrder.supplier))
        .order_by(models.PurchaseOrder.created_at.desc())
        .all()
    )


@router.post("", response_model=PurchaseOrderRead, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    payload: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.compras)),
):
    supplier = db.get(models.Supplier, payload.supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supplier not found")

    if payload.deal_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="deal_id is required for purchase orders")
    if not db.get(models.Deal, payload.deal_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deal not found")
    if payload.unit_price is not None and payload.unit_price <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Preço unitário deve ser positivo.")

    po_number = payload.po_number or _generate_po_number()

    po = models.PurchaseOrder(
        po_number=po_number,
        supplier_id=payload.supplier_id,
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
        avg_cost=payload.avg_cost,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(po)
    db.flush()

    exposure = models.Exposure(
        source_type=models.MarketObjectType.po,
        source_id=po.id,
        exposure_type=models.ExposureType.passive,
        quantity_mt=po.total_quantity_mt,
        product=po.product,
        payment_date=None,
        delivery_date=po.expected_delivery_date,
        sale_date=None,
    )
    db.add(exposure)
    db.flush()
    task = models.HedgeTask(exposure_id=exposure.id)
    db.add(task)

    try:
        link_purchase_order_to_deal(db, po, payload.deal_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    db.commit()
    db.refresh(po)
    return po


@router.get("/{po_id}", response_model=PurchaseOrderRead)
def get_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.compras)),
):
    po = (
        db.query(models.PurchaseOrder)
        .options(joinedload(models.PurchaseOrder.supplier))
        .filter(models.PurchaseOrder.id == po_id)
        .first()
    )
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase Order not found")
    return po


@router.put("/{po_id}", response_model=PurchaseOrderRead)
def update_purchase_order(
    po_id: int,
    payload: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.compras)),
):
    po = db.get(models.PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase Order not found")

    data = payload.dict(exclude_unset=True)
    # deal_id is used only for linking, not stored on PO
    data.pop("deal_id", None)
    for field, value in data.items():
        setattr(po, field, value)

    db.add(po)
    db.commit()
    db.refresh(po)
    return po


@router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase_order(
    po_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.compras)),
):
    po = db.get(models.PurchaseOrder, po_id)
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase Order not found")
    db.delete(po)
    db.commit()
