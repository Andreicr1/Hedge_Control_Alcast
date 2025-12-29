from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import HedgeTaskRead
from app.api.deps import require_roles


router = APIRouter(prefix="/exposure-links", tags=["exposure_links"])


@router.get("", response_model=List[HedgeTaskRead])
def list_links(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    return db.query(models.HedgeTask).all()
