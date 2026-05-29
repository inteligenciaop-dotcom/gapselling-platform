from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.scheduler import shutdown_scheduler, start_scheduler


@asynccontextmanager
async def lifespan(_app: FastAPI):
    start_scheduler()
    try:
        yield
    finally:
        shutdown_scheduler()


_settings = get_settings()
_cors_origins = _settings.cors_origin_list

app = FastAPI(
    title="GapSelling API",
    version="0.1.0",
    description="API multi-tenant GapSelling - MVP",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
