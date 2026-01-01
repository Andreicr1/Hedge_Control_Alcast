from typing import List
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app import models
from app.schemas import (
    RfqCreate,
    RfqRead,
    RfqUpdate,
    RfqQuoteCreate,
    RfqQuoteRead,
    RfqInvitationCreate,
    RfqAwardRequest,
    ContractRead,
)
from app.api.deps import require_roles
from app.models.domain import RfqStatus
from app.services.rfq_message_builder import build_rfq_message
from app import models as m

router = APIRouter(prefix="/rfqs", tags=["rfqs"])
logger = logging.getLogger("alcast.rfqs")


def _group_trades(quotes: list[models.RfqQuote]) -> list[dict]:
    grouped: dict[str, list[models.RfqQuote]] = {}
    for idx, q in enumerate(quotes):
        key = q.quote_group_id or f"q-{q.id or idx}"
        grouped.setdefault(key, []).append(q)

    trades: list[dict] = []
    for idx, (gid, legs) in enumerate(grouped.items()):
        buy = next((l for l in legs if (l.leg_side or "").lower() == "buy"), None)
        sell = next((l for l in legs if (l.leg_side or "").lower() == "sell"), None)
        if not buy or not sell:
            raise HTTPException(status_code=400, detail=f"Cotação incompleta para trade {gid}: é necessário buy e sell")
        if buy.volume_mt and sell.volume_mt and abs(buy.volume_mt - sell.volume_mt) > 1e-6:
            raise HTTPException(status_code=400, detail=f"Volumes divergentes no trade {gid}")
        trades.append(
            {
                "trade_index": idx,
                "quote_group_id": gid,
                "legs": [
                    {
                        "quote_id": buy.id,
                        "side": "buy",
                        "price": buy.quote_price,
                        "volume_mt": buy.volume_mt,
                        "price_type": buy.price_type,
                        "valid_until": buy.valid_until.isoformat() if buy.valid_until else None,
                        "notes": buy.notes,
                    },
                    {
                        "quote_id": sell.id,
                        "side": "sell",
                        "price": sell.quote_price,
                        "volume_mt": sell.volume_mt,
                        "price_type": sell.price_type,
                        "valid_until": sell.valid_until.isoformat() if sell.valid_until else None,
                        "notes": sell.notes,
                    },
                ],
            }
        )
    return trades


@router.get("", response_model=List[RfqRead])
def list_rfqs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    return (
        db.query(models.Rfq)
        .options(
            selectinload(models.Rfq.counterparty_quotes),
            selectinload(models.Rfq.invitations),
        )
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
    if so.deal_id:
        rfq.deal_id = so.deal_id
    if payload.invitations:
        for inv in payload.invitations:
            cp = db.get(models.Counterparty, inv.counterparty_id)
            rfq.invitations.append(
                models.RfqInvitation(
                    counterparty_id=inv.counterparty_id,
                    counterparty_name=inv.counterparty_name,
                    status=inv.status,
                    expires_at=inv.expires_at,
                    message_text=build_rfq_message(rfq, cp) if cp else None,
                )
            )
    if payload.counterparty_quotes:
        for quote in payload.counterparty_quotes:
            rfq.counterparty_quotes.append(
                models.RfqQuote(
                    counterparty_id=quote.counterparty_id,
                    counterparty_name=quote.counterparty_name,
                    quote_price=quote.quote_price,
                    price_type=quote.price_type,
                    volume_mt=quote.volume_mt,
                    valid_until=quote.valid_until,
                    notes=quote.notes,
                    channel=quote.channel,
                    status=quote.status,
                    quote_group_id=quote.quote_group_id,
                    leg_side=quote.leg_side,
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
        .options(
            selectinload(models.Rfq.counterparty_quotes),
            selectinload(models.Rfq.invitations),
        )
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
    if rfq.status == RfqStatus.awarded:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RFQ já encerrado; edição não permitida",
        )

    data = payload.dict(exclude_unset=True, exclude={"counterparty_quotes"})
    if "status" in data:
        allowed = {
            RfqStatus.draft: {RfqStatus.pending, RfqStatus.sent, RfqStatus.quoted},
            RfqStatus.pending: {RfqStatus.sent, RfqStatus.quoted, RfqStatus.failed},
            RfqStatus.sent: {RfqStatus.quoted, RfqStatus.failed},
            RfqStatus.quoted: {RfqStatus.awarded, RfqStatus.failed},
            RfqStatus.failed: set(),
            RfqStatus.awarded: set(),
            RfqStatus.expired: set(),
        }
        if data["status"] not in allowed.get(rfq.status, set()):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transição de status não permitida")
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
                    price_type=quote.price_type,
                    volume_mt=quote.volume_mt,
                    valid_until=quote.valid_until,
                    notes=quote.notes,
                    channel=quote.channel,
                    status=quote.status,
                    quote_group_id=quote.quote_group_id,
                    leg_side=quote.leg_side,
                )
            )
    if payload.invitations is not None:
        rfq.invitations.clear()
        for inv in payload.invitations:
            cp = db.get(models.Counterparty, inv.counterparty_id)
            rfq.invitations.append(
                models.RfqInvitation(
                    counterparty_id=inv.counterparty_id,
                    counterparty_name=inv.counterparty_name,
                    status=inv.status,
                    expires_at=inv.expires_at,
                    message_text=build_rfq_message(rfq, cp) if cp else None,
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
    if rfq.status in {RfqStatus.awarded, RfqStatus.failed, RfqStatus.expired}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFQ encerrado para novas cotações")

    quote = models.RfqQuote(
        rfq_id=rfq_id,
        counterparty_id=payload.counterparty_id,
        counterparty_name=payload.counterparty_name,
        quote_price=payload.quote_price,
        price_type=payload.price_type,
        volume_mt=payload.volume_mt,
        valid_until=payload.valid_until,
        notes=payload.notes,
        channel=payload.channel,
        status=payload.status,
        quote_group_id=payload.quote_group_id,
        leg_side=payload.leg_side,
    )
    db.add(quote)
    # Atualiza convite correspondente, se existir
    if payload.counterparty_id:
        invitation = (
            db.query(models.RfqInvitation)
            .filter(models.RfqInvitation.rfq_id == rfq_id, models.RfqInvitation.counterparty_id == payload.counterparty_id)
            .first()
        )
        if invitation:
            invitation.status = "answered"
            invitation.responded_at = quote.quoted_at
            db.add(invitation)

    rfq.status = RfqStatus.quoted
    db.add(rfq)
    db.commit()
    db.refresh(quote)
    return quote


@router.post("/{rfq_id}/award", response_model=RfqRead)
def award_quote(
    rfq_id: int,
    payload: RfqAwardRequest,
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ não encontrado")
    if rfq.status in {RfqStatus.awarded, RfqStatus.failed, RfqStatus.expired}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFQ já encerrado")
    if rfq.status not in {RfqStatus.quoted, RfqStatus.sent, RfqStatus.pending, RfqStatus.draft}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFQ não está pronta para decisão")

    quote = next((q for q in rfq.counterparty_quotes if q.id == payload.quote_id), None)
    if not quote:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cotação não encontrada neste RFQ")

    # Ranking posição simples (menor preço vence; se precisar lado considerar campo futuro)
    sorted_quotes = sorted(rfq.counterparty_quotes, key=lambda q: q.quote_price)
    rank_position = next((idx + 1 for idx, q in enumerate(sorted_quotes) if q.id == quote.id), None)

    rfq.winner_quote_id = quote.id
    rfq.decision_reason = payload.motivo
    rfq.decided_by = current_user.id
    rfq.decided_at = datetime.utcnow()
    rfq.winner_rank = rank_position
    rfq.hedge_id = payload.hedge_id
    rfq.hedge_reference = payload.hedge_reference
    rfq.status = RfqStatus.awarded

    # Atualiza convites para status final
    for inv in rfq.invitations:
        if inv.counterparty_id == quote.counterparty_id:
            inv.status = "winner"
        else:
            inv.status = "lost" if inv.status not in {"expired", "refused"} else inv.status
        db.add(inv)

    db.add(rfq)
    # contratos: um por trade do vencedor
    winner_cp_id = quote.counterparty_id
    winner_quotes = [q for q in rfq.counterparty_quotes if q.counterparty_id == winner_cp_id]
    trades = _group_trades(winner_quotes)
    deal_id = rfq.deal_id or (rfq.sales_order.deal_id if rfq.sales_order else None)
    if not deal_id:
        raise HTTPException(status_code=400, detail="RFQ não possui deal associado para criar contratos")
    for trade in trades:
        contract = models.Contract(
            deal_id=deal_id,
            rfq_id=rfq.id,
            counterparty_id=winner_cp_id,
            status="active",
            trade_index=trade.get("trade_index"),
            quote_group_id=trade.get("quote_group_id"),
            trade_snapshot=trade,
            created_by=current_user.id,
        )
        db.add(contract)

    db.commit()
    logger.info(
        "rfq.awarded",
        extra={
            "rfq_id": rfq.id,
            "winner_quote_id": quote.id,
            "decided_by": current_user.id,
            "rank": rank_position,
        },
    )
    db.refresh(rfq)
    return rfq


@router.post("/{rfq_id}/cancel", response_model=RfqRead)
def cancel_rfq(
    rfq_id: int,
    motivo: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(models.RoleName.admin, models.RoleName.financeiro)),
):
    rfq = db.get(models.Rfq, rfq_id)
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ não encontrado")
    if rfq.status in {RfqStatus.awarded, RfqStatus.failed}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RFQ já encerrado")

    rfq.status = RfqStatus.failed
    rfq.decision_reason = motivo
    rfq.decided_by = current_user.id
    rfq.decided_at = datetime.utcnow()
    db.add(rfq)
    db.commit()
    db.refresh(rfq)
    return rfq


@router.get("/{rfq_id}/quotes/export")
def export_quotes_csv(
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ não encontrado")

    rfq = (
        db.query(models.Rfq)
        .options(selectinload(models.Rfq.counterparty_quotes))
        .filter(models.Rfq.id == rfq_id)
        .first()
    )
    if not rfq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ não encontrado")

    def _csv_escape(value):
        s = (value or "").replace('"', '""')
        return f'"{s}"'

    rows = [
        "quote_id,counterparty,price,volume_mt,channel,status,quoted_at,notes"
    ]

    for q in rfq.counterparty_quotes:
        rows.append(
            ",".join(
                [
                    str(q.id),
                    _csv_escape(q.counterparty_name),
                    str(q.quote_price or ""),
                    str(q.volume_mt or ""),
                    _csv_escape(q.channel),
                    q.status or "",
                    q.quoted_at.isoformat() if q.quoted_at else "",
                    _csv_escape(q.notes),
                ]
            )
        )

    csv_data = "\n".join(rows)

    headers = {
        "Content-Disposition": f'attachment; filename="rfq_{rfq_id}_quotes.csv"'
    }

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers=headers,
    )
