from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas import UserCreate, UserRead
from app.api.deps import get_current_user_optional, require_roles
from app.services.auth import hash_password
from app.services.audit import audit_event

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_current_user_optional),
):
    existing_users = db.query(models.User).count()
    if existing_users > 0:
        if not current_user or current_user.role.name != models.RoleName.admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required to create users")

    role = db.query(models.Role).filter(models.Role.name == payload.role).first()
    if not role:
        role = models.Role(name=payload.role, description=payload.role.value if hasattr(payload.role, "value") else str(payload.role))
        db.add(role)
        db.flush()

    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = models.User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
        role_id=role.id,
        active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    audit_event("user.created", current_user.id if current_user else None, {"user_id": user.id, "email": user.email})
    return user


@router.get("", response_model=List[UserRead], dependencies=[Depends(require_roles(models.RoleName.admin))])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()
