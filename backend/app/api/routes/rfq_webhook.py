import json
import hashlib
import hmac
import time
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.models.domain import SendStatus
from pydantic import BaseModel
from app.services.audit import audit_event
from app.config import settings

router = APIRouter(prefix="/rfqs/webhook", tags=["rfq_webhook"])


class WebhookPayload(BaseModel):
    provider_message_id: str
    status: SendStatus
    error: str | None = None
    metadata: dict | None = None


SIGNATURE_HEADER = "x-signature"
TIMESTAMP_HEADER = "x-request-timestamp"
MAX_SKEW_SECONDS = 300


def _valid_signature(raw_body: bytes, signature_header: str | None, timestamp_header: str | None) -> bool:
    if not settings.webhook_secret:
        return True
    if not signature_header:
        return False
    try:
        ts = int(timestamp_header) if timestamp_header else None
    except ValueError:
        ts = None

    if ts is not None:
        now = int(time.time())
        if abs(now - ts) > MAX_SKEW_SECONDS:
            return False

    secret = settings.webhook_secret.encode()
    expected = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
    provided = signature_header.split("=", 1)[-1].strip()
    return hmac.compare_digest(expected, provided)


@router.post("", status_code=status.HTTP_200_OK)
async def update_send_status_webhook(
    payload: WebhookPayload,
    db: Session = Depends(get_db),
    request: Request = None,
    x_api_key: str | None = Header(default=None),
    x_signature: str | None = Header(default=None, convert_underscores=False),
    x_request_timestamp: str | None = Header(default=None, convert_underscores=False),
):
    raw_body = await request.body() if request is not None else b""
    if settings.webhook_secret:
        signature_ok = _valid_signature(raw_body, x_signature, x_request_timestamp)
        api_key_ok = x_api_key == settings.webhook_secret
        if not signature_ok and not api_key_ok:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")
    attempt = (
        db.query(models.RfqSendAttempt)
        .filter(models.RfqSendAttempt.provider_message_id == payload.provider_message_id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found for provider_message_id")

    rfq = db.get(models.Rfq, attempt.rfq_id)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    attempt.status = payload.status
    attempt.error = payload.error
    attempt.metadata_json = json.dumps(payload.metadata or {})
    attempt.updated_at = datetime.utcnow()

    if payload.status == SendStatus.failed:
        rfq.status = models.RfqStatus.failed
    elif payload.status in (SendStatus.delivered, SendStatus.read) and rfq.status == models.RfqStatus.sent:
        rfq.status = models.RfqStatus.sent

    db.add(attempt)
    db.add(rfq)
    db.commit()
    db.refresh(attempt)

    audit_event(
        "rfq.webhook_status",
        None,
        {
            "rfq_id": rfq.id,
            "attempt_id": attempt.id,
            "status": attempt.status.value,
            "signature_valid": True,
        },
    )
    return {"status": attempt.status.value}
