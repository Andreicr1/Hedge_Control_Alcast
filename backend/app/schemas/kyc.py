from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class KycDocumentRead(BaseModel):
    id: int
    owner_type: Literal["customer", "supplier"]
    owner_id: int
    filename: str
    content_type: Optional[str]
    path: str
    uploaded_at: datetime

    class Config:
        orm_mode = True


class CreditCheckRead(BaseModel):
    id: int
    owner_type: Literal["customer", "supplier"]
    owner_id: int
    bureau: Optional[str]
    score: Optional[int]
    status: Optional[str]
    raw_response: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
