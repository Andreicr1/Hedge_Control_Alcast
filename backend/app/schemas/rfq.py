from pydantic import BaseModel
from typing import Optional


class RfqQuoteSelect(BaseModel):
    quote_id: int


class RfqAwardRequest(BaseModel):
    quote_id: int
    motivo: Optional[str] = None
    hedge_id: Optional[int] = None
    hedge_reference: Optional[str] = None
