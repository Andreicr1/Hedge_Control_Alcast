from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.api.deps import require_roles
from app.schemas import HedgeCreateManual, HedgeReadManual

router = APIRouter(prefix="/hedges/manual", tags=["hedges_manual"])


@router.post("", response_model=HedgeReadManual, status_code=status.HTTP_201_CREATED)
def create_manual_hedge(
    payload: HedgeCreateManual,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    counterparty = db.get(models.Counterparty, payload.counterparty_id)
    if not counterparty:
        raise HTTPException(status_code=400, detail="Counterparty not found")

    if not payload.exposures:
        raise HTTPException(status_code=400, detail="At least one exposure is required")

    hedge = models.Hedge(
        counterparty_id=payload.counterparty_id,
        quantity_mt=payload.quantity_mt,
        contract_price=payload.contract_price,
        period=payload.period,
        instrument=payload.instrument,
        maturity_date=payload.maturity_date,
        reference_code=payload.reference_code,
        status=models.HedgeStatus.active,
    )
    db.add(hedge)
    db.flush()

    for link in payload.exposures:
        exposure = db.get(models.Exposure, link.exposure_id)
        if not exposure:
            raise HTTPException(status_code=404, detail=f"Exposure {link.exposure_id} not found")
        if exposure.status == models.ExposureStatus.closed:
            raise HTTPException(status_code=400, detail=f"Exposure {link.exposure_id} closed")
        db.add(models.HedgeExposure(hedge_id=hedge.id, exposure_id=exposure.id, quantity_mt=link.quantity_mt))
        # update exposure status
        remaining = exposure.quantity_mt - link.quantity_mt
        if remaining <= 0:
            exposure.status = models.ExposureStatus.hedged
        else:
            exposure.status = models.ExposureStatus.partially_hedged
        for task in exposure.tasks:
            task.status = models.HedgeTaskStatus.hedged
        db.add(exposure)

    db.commit()
    db.refresh(hedge)
    return hedge
