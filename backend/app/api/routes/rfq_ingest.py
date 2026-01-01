from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.orm import Session

from app import models
from app.api.deps import require_roles
from app.config import settings
from app.database import get_db
from app.models.domain import RfqStatus
from app.schemas import RfqQuoteCreate, RfqQuoteRead

router = APIRouter(prefix="/rfqs", tags=["rfqs-ingest"])


class RfqIngestRequest(RfqQuoteCreate):
    rfq_id: Optional[int] = None
    channel: Optional[str] = "api"
    message_id: Optional[str] = None


def _is_duplicate(db: Session, rfq_id: int, counterparty_id: Optional[int], message_id: Optional[str]) -> Optional[models.RfqQuote]:
    if not message_id or not counterparty_id:
        return None
    return (
        db.query(models.RfqQuote)
        .filter(
            models.RfqQuote.rfq_id == rfq_id,
            models.RfqQuote.counterparty_id == counterparty_id,
            models.RfqQuote.channel == "whatsapp",
            models.RfqQuote.notes.contains(message_id),
        )
        .first()
    )


@router.post("/{rfq_id}/ingest", response_model=RfqQuoteRead)
def ingest_quote(
    rfq_id: int,
    payload: RfqIngestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    rfq = db.get(models.Rfq, rfq_id)
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ não encontrado")
    if rfq.status == RfqStatus.awarded:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFQ encerrado para novas cotações")

    counterparty_id = payload.counterparty_id
    if not counterparty_id and not payload.counterparty_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contraparte obrigatória")

    existing = _is_duplicate(db, rfq_id, counterparty_id, payload.message_id)
    if existing:
        return existing

    invitation = None
    if counterparty_id:
        invitation = (
            db.query(models.RfqInvitation)
            .filter(models.RfqInvitation.rfq_id == rfq_id, models.RfqInvitation.counterparty_id == counterparty_id)
            .first()
        )
    if not invitation and counterparty_id:
        invitation = models.RfqInvitation(
            rfq_id=rfq_id,
            counterparty_id=counterparty_id,
            counterparty_name=payload.counterparty_name,
            status="sent",
        )
        db.add(invitation)

    note_text = payload.notes or ""
    if payload.message_id:
        note_text = f"{note_text} [msg:{payload.message_id}]".strip()

    quote = models.RfqQuote(
        rfq_id=rfq_id,
        counterparty_id=payload.counterparty_id,
        counterparty_name=payload.counterparty_name,
        quote_price=payload.quote_price,
        price_type=payload.price_type,
        volume_mt=payload.volume_mt,
        valid_until=payload.valid_until,
        notes=note_text or None,
        channel=payload.channel or "api",
        status="quoted",
        quoted_at=datetime.utcnow(),
    )
    db.add(quote)

    if invitation:
        invitation.status = "answered"
        invitation.responded_at = quote.quoted_at
        db.add(invitation)

    rfq.status = RfqStatus.quoted
    db.add(rfq)
    db.commit()
    db.refresh(quote)
    return quote
