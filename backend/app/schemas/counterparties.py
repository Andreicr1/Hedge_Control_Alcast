from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.domain import CounterpartyType


class CounterpartyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    type: CounterpartyType
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=64)
    active: bool = True


class CounterpartyCreate(CounterpartyBase):
    pass


class CounterpartyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[CounterpartyType] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    active: Optional[bool] = None


class CounterpartyRead(CounterpartyBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
