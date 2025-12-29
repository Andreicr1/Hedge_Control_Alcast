from typing import List
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app import models
from app.schemas import RfqCreate, RfqRead, RfqUpdate, RfqQuoteCreate, RfqQuoteRead
from app.api.deps import require_roles
from app.models.domain import RfqStatus

router = APIRouter(prefix="/rfqs", tags=["rfqs"])
logger = logging.getLogger("alcast.rfqs")


@router.get("", response_model=List[RfqRead])
def list_rfqs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    return (
        db.query(models.Rfq)
        .options(selectinload(models.Rfq.counterparty_quotes))
        .order_by(models.Rfq.created_at.desc())
        .all()
    )


@router.post("", response_model=RfqRead, status_code=status.HTTP_201_CREATED)
def create_rfq(
    payload: RfqCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    so = db.get(models.SalesOrder, payload.so_id)
    if not so:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sales Order not found")

    rfq = models.Rfq(
        rfq_number=payload.rfq_number,
        so_id=payload.so_id,
        quantity_mt=payload.quantity_mt,
        period=payload.period,
        status=payload.status,
        message_text=payload.message_text,
    )
    if payload.counterparty_quotes:
        for quote in payload.counterparty_quotes:
            rfq.counterparty_quotes.append(
                models.RfqQuote(
                    counterparty_id=quote.counterparty_id,
                    counterparty_name=quote.counterparty_name,
                    quote_price=quote.quote_price,
                    status=quote.status,
                )
            )

    db.add(rfq)
    db.commit()
    db.refresh(rfq)
    logger.info("rfq.created", extra={"rfq_id": rfq.id, "rfq_number": rfq.rfq_number})
    return rfq


@router.get("/{rfq_id}", response_model=RfqRead)
def get_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    rfq = (
        db.query(models.Rfq)
        .options(selectinload(models.Rfq.counterparty_quotes))
        .filter(models.Rfq.id == rfq_id)
        .first()
    )
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")
    return rfq


@router.put("/{rfq_id}", response_model=RfqRead)
def update_rfq(
    rfq_id: int,
    payload: RfqUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    rfq = db.get(models.Rfq, rfq_id)
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")

    data = payload.dict(exclude_unset=True, exclude={"counterparty_quotes"})
    for field, value in data.items():
        setattr(rfq, field, value)

    if payload.counterparty_quotes is not None:
        rfq.counterparty_quotes.clear()
        for quote in payload.counterparty_quotes:
            rfq.counterparty_quotes.append(
                models.RfqQuote(
                    counterparty_id=quote.counterparty_id,
                    counterparty_name=quote.counterparty_name,
                    quote_price=quote.quote_price,
                    status=quote.status,
                )
            )

    db.add(rfq)
    db.commit()
    db.refresh(rfq)
    return rfq


@router.post("/{rfq_id}/send", response_model=RfqRead)
def send_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    rfq = db.get(models.Rfq, rfq_id)
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")
    if rfq.status not in {RfqStatus.pending, RfqStatus.draft, RfqStatus.quoted}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFQ cannot be sent in current status")

    rfq.status = RfqStatus.sent
    db.add(rfq)
    db.commit()
    db.refresh(rfq)
    logger.info("rfq.sent", extra={"rfq_id": rfq.id, "rfq_number": rfq.rfq_number})
    return rfq


@router.post("/{rfq_id}/quotes", response_model=RfqQuoteRead, status_code=status.HTTP_201_CREATED)
def add_quote(
    rfq_id: int,
    payload: RfqQuoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    rfq = db.get(models.Rfq, rfq_id)
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")

    quote = models.RfqQuote(
        rfq_id=rfq_id,
        counterparty_id=payload.counterparty_id,
        counterparty_name=payload.counterparty_name,
        quote_price=payload.quote_price,
        status=payload.status,
    )
    db.add(quote)
    rfq.status = RfqStatus.quoted
    db.add(rfq)
    db.commit()
    db.refresh(quote)
    return quote
