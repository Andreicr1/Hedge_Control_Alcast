from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import CounterpartyCreate, CounterpartyRead, CounterpartyUpdate
from app.api.deps import require_roles

router = APIRouter(prefix="/counterparties", tags=["counterparties"])


@router.get("", response_model=List[CounterpartyRead])
def list_counterparties(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    return db.query(models.Counterparty).order_by(models.Counterparty.name.asc()).all()


@router.post("", response_model=CounterpartyRead, status_code=status.HTTP_201_CREATED)
def create_counterparty(
    payload: CounterpartyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    if db.query(models.Counterparty).filter(models.Counterparty.name == payload.name).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Counterparty already exists")
    cp = models.Counterparty(**payload.dict(exclude_unset=True))
    db.add(cp)
    db.commit()
    db.refresh(cp)
    return cp


@router.put("/{counterparty_id}", response_model=CounterpartyRead)
def update_counterparty(
    counterparty_id: int,
    payload: CounterpartyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    cp = db.get(models.Counterparty, counterparty_id)
    if not cp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Counterparty not found")

    data = payload.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(cp, field, value)

    db.add(cp)
    db.commit()
    db.refresh(cp)
    return cp


@router.delete("/{counterparty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_counterparty(
    counterparty_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    cp = db.get(models.Counterparty, counterparty_id)
    if not cp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Counterparty not found")
    db.delete(cp)
    db.commit()
