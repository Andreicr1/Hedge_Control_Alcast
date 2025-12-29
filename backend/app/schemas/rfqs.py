from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, validator

from app.models.domain import RfqStatus


class RfqQuoteBase(BaseModel):
    counterparty_id: Optional[int] = None
    counterparty_name: str = Field(..., min_length=1, max_length=255)
    quote_price: float = Field(..., gt=0)
    status: str = "quoted"


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
    pass


class RfqUpdate(BaseModel):
    rfq_number: Optional[str] = None
    so_id: Optional[int] = None
    quantity_mt: Optional[float] = None
    period: Optional[str] = None
    status: Optional[RfqStatus] = None
    counterparty_quotes: Optional[List[RfqQuoteCreate]] = None
    message_text: Optional[str] = None


class RfqRead(RfqBase):
    id: int
    created_at: datetime
    counterparty_quotes: List[RfqQuoteRead] = []

    class Config:
        orm_mode = True
