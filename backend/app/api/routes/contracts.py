from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.database import get_db
from app import models
from app.schemas import ContractRead

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.get("", response_model=List[ContractRead])
def list_contracts(
    rfq_id: int | None = None,
    deal_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    query = db.query(models.Contract)
    if rfq_id:
        query = query.filter(models.Contract.rfq_id == rfq_id)
    if deal_id:
        query = query.filter(models.Contract.deal_id == deal_id)
    return query.order_by(models.Contract.created_at.desc()).all()


@router.get("/{contract_id}", response_model=ContractRead)
def get_contract(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    contract = db.get(models.Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract
