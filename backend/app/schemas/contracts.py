from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ContractRead(BaseModel):
    contract_id: str
    deal_id: int
    rfq_id: int
    counterparty_id: Optional[int] = None
    status: str
    trade_index: Optional[int] = None
    quote_group_id: Optional[str] = None
    trade_snapshot: dict
    created_at: datetime

    class Config:
        orm_mode = True
