import json
import os
from typing import List

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    app_name: str = Field(default=os.getenv("PROJECT_NAME", "Hedge Control API"))
    environment: str = Field(default="dev")
    database_url: str = Field(default=os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/alcast_db"))
    api_prefix: str = Field(default=os.getenv("API_V1_STR", ""))
    enable_docs: bool = True
    secret_key: str = Field(default=os.getenv("SECRET_KEY", "change-me"))
    access_token_expire_minutes: int = Field(default=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")))
    algorithm: str = Field(default=os.getenv("ALGORITHM", "HS256"))
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://alcast.com.br",
    ]
    storage_dir: str = Field(default=os.getenv("STORAGE_DIR", "storage"))
    whatsapp_webhook_secret: str | None = Field(default=os.getenv("WHATSAPP_WEBHOOK_SECRET"))

    class Config:
        env_file = ".env"
        case_sensitive = False

    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return [v.strip() for v in value.split(",") if v.strip()]
        return value

    @validator("secret_key")
    def validate_secret_key(cls, v: str) -> str:
        if not v or v.startswith("sua-chave-secreta") or v.lower() in {"change-me", "secret"}:
            raise ValueError("SECRET_KEY must be set to a strong value")
        return v


settings = Settings()
