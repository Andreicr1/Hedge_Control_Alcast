from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, validator

from app.models.domain import RfqStatus


class RfqQuoteBase(BaseModel):
    counterparty_id: Optional[int] = None
    counterparty_name: str = Field(..., min_length=1, max_length=255)
    quote_price: float = Field(..., gt=0)
    price_type: Optional[str] = Field(None, max_length=128)
    volume_mt: Optional[float] = Field(None, gt=0)
    valid_until: Optional[datetime] = None
    notes: Optional[str] = None
    channel: Optional[str] = Field(None, max_length=64)
    status: str = "quoted"
    quote_group_id: Optional[str] = Field(None, max_length=64)
    leg_side: Optional[str] = Field(None, max_length=8)


class RfqQuoteCreate(RfqQuoteBase):
    pass


class RfqQuoteRead(RfqQuoteBase):
    id: int
    quoted_at: datetime

    class Config:
        orm_mode = True


class RfqBase(BaseModel):
    rfq_number: str = Field(..., min_length=1, max_length=50)
    so_id: int = Field(..., gt=0)
    quantity_mt: float = Field(..., gt=0)
    period: str = Field(..., min_length=1, max_length=20)
    status: RfqStatus = RfqStatus.pending
    message_text: Optional[str] = None

    @validator("rfq_number")
    def clean_rfq_number(cls, v: str) -> str:
        return v.strip()


class RfqCreate(RfqBase):
    counterparty_quotes: Optional[List[RfqQuoteCreate]] = None
    invitations: Optional[List["RfqInvitationCreate"]] = None


class RfqUpdate(BaseModel):
    rfq_number: Optional[str] = None
    so_id: Optional[int] = None
    quantity_mt: Optional[float] = None
    period: Optional[str] = None
    status: Optional[RfqStatus] = None
    counterparty_quotes: Optional[List[RfqQuoteCreate]] = None
    message_text: Optional[str] = None
    invitations: Optional[List["RfqInvitationCreate"]] = None


class RfqRead(RfqBase):
    id: int
    deal_id: Optional[int] = None
    created_at: datetime
    counterparty_quotes: List[RfqQuoteRead] = []
    invitations: List["RfqInvitationRead"] = []
    winner_quote_id: Optional[int] = None
    decision_reason: Optional[str] = None
    decided_by: Optional[int] = None
    decided_at: Optional[datetime] = None
    winner_rank: Optional[int] = None
    hedge_id: Optional[int] = None
    hedge_reference: Optional[str] = None

    class Config:
        orm_mode = True


class RfqInvitationBase(BaseModel):
    counterparty_id: int
    counterparty_name: Optional[str] = None
    status: str = "sent"
    expires_at: Optional[datetime] = None
    message_text: Optional[str] = None


class RfqInvitationCreate(RfqInvitationBase):
    pass


class RfqInvitationRead(RfqInvitationBase):
    id: int
    sent_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        orm_mode = True


RfqUpdate.update_forward_refs()
RfqRead.update_forward_refs()


class RfqAwardRequest(BaseModel):
    quote_id: int
    motivo: str = Field(..., min_length=3)
    hedge_id: Optional[int] = None
    hedge_reference: Optional[str] = None
