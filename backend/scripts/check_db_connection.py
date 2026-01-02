"""
Pequeno utilitário para validar conectividade com o banco configurado em DATABASE_URL.

Uso:
  DATABASE_URL="postgresql://..." python3 backend/scripts/check_db_connection.py

Saída:
  - Retorna 0 se conectar e executar "SELECT 1"
  - Retorna 2 se DATABASE_URL não estiver configurado
  - Retorna 1 em falha de conexão/consulta
"""

from __future__ import annotations

import os
import sys
from urllib.parse import urlsplit, urlunsplit

from sqlalchemy import create_engine, text


def _redact_url(url: str) -> str:
    """
    Remove password da URL para evitar vazamento em logs/prints.
    """
    try:
        parts = urlsplit(url)
        if parts.password is None:
            return url
        netloc = parts.hostname or ""
        if parts.username:
            netloc = f"{parts.username}:***@{netloc}"
        if parts.port:
            netloc = f"{netloc}:{parts.port}"
        return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
    except Exception:
        return "<invalid DATABASE_URL>"


def main() -> int:
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL não configurado; nada para testar.", file=sys.stderr)
        return 2

    connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT_SECONDS", "10"))
    safe_url = _redact_url(url)

    try:
        engine = create_engine(
            url,
            future=True,
            pool_pre_ping=True,
            connect_args={"connect_timeout": connect_timeout} if url.startswith("postgresql") else {},
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1")).scalar_one()
        print(f"OK: conexão com DB estabelecida ({safe_url})")
        return 0
    except Exception as exc:
        print(f"ERRO: não foi possível conectar no DB ({safe_url}): {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

