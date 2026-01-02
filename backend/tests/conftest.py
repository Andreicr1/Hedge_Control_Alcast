import os


def pytest_configure():
    """
    Global test environment defaults.

    A maioria dos módulos importa `app.config.settings` em import-time e o Settings
    exige SECRET_KEY forte. Para evitar falhas/ordem de import, garantimos defaults
    aqui antes da coleta/executação dos testes.
    """
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault("SCHEDULER_ENABLED", "false")
    os.environ.setdefault("SECRET_KEY", "test-secret-key-1234567890")
    # Default test DB; testes específicos podem sobrescrever.
    os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")

