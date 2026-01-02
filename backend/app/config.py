import json
import os
import re
from typing import List

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    app_name: str = Field(default=os.getenv("PROJECT_NAME", "Hedge Control API"))
    environment: str = Field(default="dev")
    database_url: str = Field(default=os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/alcast_db"))
    # API prefix used by FastAPI router include. MUST be configured via API_V1_STR (e.g. "/api/v1").
    api_prefix: str = Field(default="", env="API_V1_STR")
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
    webhook_secret: str | None = Field(default=os.getenv("WEBHOOK_SECRET"))
    scheduler_enabled: bool = Field(default=os.getenv("SCHEDULER_ENABLED", "true"))

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

    @validator("api_prefix", pre=True)
    def normalize_api_prefix(cls, v: str) -> str:
        """
        Normalize API prefix coming from env/.env.

        On Windows Git Bash (MSYS), values like "/api/v1" may sometimes appear as a Windows path
        (e.g. "C:/Program Files/Git/api/v1"). When that happens, extract the trailing "/api/..."
        portion so routing keeps working.
        """
        if v is None:
            return ""
        s = str(v).strip()
        if not s:
            return ""

        # If it already looks like an API prefix, keep it.
        if s.startswith("/api/") or s == "/api":
            return s

        # Extract "/api/..." from any path-like string.
        m = re.search(r"(/api/[^\\s]+)$", s.replace("\\", "/"))
        if m:
            return m.group(1)

        # Final fallback: if a bare "api/v1" was provided, normalize to "/api/v1".
        if s.startswith("api/"):
            return f"/{s}"

        return s

    @validator("secret_key")
    def validate_secret_key(cls, v: str) -> str:
        if not v or v.startswith("sua-chave-secreta") or v.lower() in {"change-me", "secret"}:
            raise ValueError("SECRET_KEY must be set to a strong value")
        return v


settings = Settings()
