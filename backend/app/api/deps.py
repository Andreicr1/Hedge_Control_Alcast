from typing import Optional, Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, RoleName
from app.services.auth import decode_access_token


def _token_url() -> str:
    if settings.api_prefix:
        prefix = settings.api_prefix.rstrip("/")
        return f"{prefix}/auth/token"
    return "/auth/token"


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=_token_url())
oauth2_optional = OAuth2PasswordBearer(tokenUrl=_token_url(), auto_error=False)


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    subject = decode_access_token(token)
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = db.query(User).filter(User.email == subject, User.active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def get_current_user_optional(
    db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_optional)
) -> Optional[User]:
    if not token:
        return None
    try:
        return get_current_user(db=db, token=token)
    except HTTPException:
        return None


def require_roles(*roles: RoleName) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if roles and user.role.name not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return dependency
