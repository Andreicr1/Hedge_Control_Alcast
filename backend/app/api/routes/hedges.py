from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import HedgeCreate, HedgeRead, HedgeUpdate
from app.api.deps import require_roles

router = APIRouter(prefix="/hedges", tags=["hedges"])


@router.get("", response_model=List[HedgeRead])
def list_hedges(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    return db.query(models.Hedge).order_by(models.Hedge.created_at.desc()).all()


@router.post("", response_model=HedgeRead, status_code=status.HTTP_201_CREATED)
def create_hedge(
    payload: HedgeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    if not db.get(models.SalesOrder, payload.so_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sales Order not found")
    if not db.get(models.Counterparty, payload.counterparty_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Counterparty not found")

    hedge = models.Hedge(
        so_id=payload.so_id,
        counterparty_id=payload.counterparty_id,
        quantity_mt=payload.quantity_mt,
        contract_price=payload.contract_price,
        current_market_price=payload.current_market_price,
        mtm_value=payload.mtm_value,
        period=payload.period,
        status=payload.status,
    )
    db.add(hedge)
    db.commit()
    db.refresh(hedge)
    return hedge


@router.put("/{hedge_id}", response_model=HedgeRead)
def update_hedge(
    hedge_id: int,
    payload: HedgeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    hedge = db.get(models.Hedge, hedge_id)
    if not hedge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hedge not found")

    data = payload.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(hedge, field, value)

    db.add(hedge)
    db.commit()
    db.refresh(hedge)
    return hedge
