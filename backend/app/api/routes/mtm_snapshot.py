from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import models
from app.api.deps import require_roles
from app.database import get_db
from app.schemas import MTMSnapshotRead, MTMSnapshotCreate
from app.services.mtm_snapshot_service import create_snapshot, list_snapshots

router = APIRouter(prefix="/mtm/snapshots", tags=["mtm_snapshots"])


@router.post("", response_model=MTMSnapshotRead, status_code=status.HTTP_201_CREATED)
def create_mtm_snapshot(
    payload: MTMSnapshotCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    try:
        snap = create_snapshot(db, payload)
        return snap
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("", response_model=List[MTMSnapshotRead])
def get_mtm_snapshots(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
    object_type: Optional[models.MarketObjectType] = Query(None),
    object_id: Optional[int] = Query(None),
    product: Optional[str] = Query(None),
    period: Optional[str] = Query(None),
    latest: bool = Query(False),
):
    snaps = list_snapshots(db, object_type=object_type, object_id=object_id, product=product, period=period, latest=latest)
    return snaps
