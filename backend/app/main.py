import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.router import api_router

api_prefix = settings.api_prefix if settings.api_prefix.startswith("/") else f"/{settings.api_prefix}" if settings.api_prefix else ""

logger = logging.getLogger("alcast")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

app = FastAPI(
    title=settings.app_name,
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None,
    openapi_url=f"{api_prefix}/openapi.json" if api_prefix else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=api_prefix)


@app.get("/", tags=["meta"])
def root():
    docs_path = f"{api_prefix}/openapi.json" if api_prefix else "/openapi.json"
    logger.info("health_check", extra={"event": "root", "status": "ok"})
    return {"message": "Hedge Control API", "docs": docs_path}
