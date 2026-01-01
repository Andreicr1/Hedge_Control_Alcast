from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.database import get_db
from app import models
from app.schemas import DealPnlResponse
from app.services.deal_engine import calculate_deal_pnl

router = APIRouter(prefix="/deals", tags=["deals"])


@router.get("/{deal_id}/pnl", response_model=DealPnlResponse)
def get_deal_pnl(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    try:
        result = calculate_deal_pnl(db, deal_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not result:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.commit()
    return result
