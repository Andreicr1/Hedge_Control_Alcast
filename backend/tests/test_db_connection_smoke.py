import os

import pytest
from sqlalchemy import create_engine, text


def _is_postgres_url(url: str) -> bool:
    u = (url or "").lower()
    return u.startswith("postgresql://") or u.startswith("postgres://")


@pytest.mark.db
def test_database_connection_smoke():
    """
    Smoke test de conectividade com DB real.

    - Só roda quando DATABASE_URL for Postgres (ambientes locais/CI com DB provisionado).
    - Em ambientes de teste unitário (SQLite in-memory), é automaticamente pulado.
    """
    url = os.getenv("DATABASE_URL", "")
    if not _is_postgres_url(url):
        pytest.skip("DATABASE_URL não é Postgres; pulando teste de conectividade real")

    connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT_SECONDS", "10"))
    engine = create_engine(
        url,
        future=True,
        pool_pre_ping=True,
        connect_args={"connect_timeout": connect_timeout},
    )

    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar_one()
        assert result == 1

