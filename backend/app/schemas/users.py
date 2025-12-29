from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.domain import RoleName


class RoleRead(BaseModel):
    id: int
    name: RoleName
    description: Optional[str]

    class Config:
        orm_mode = True


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: RoleName


class UserRead(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: RoleRead
    active: bool
    created_at: datetime

    class Config:
        orm_mode = True
