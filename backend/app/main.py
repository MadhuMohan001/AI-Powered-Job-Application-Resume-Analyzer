import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import analysis, applications, assistant, auth, dashboard, jobs, resumes
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(title="AI Resume & Job Application Analyzer", version="1.0.0")

# Explicit origins (no "*"). We use Bearer tokens, not cookies, so credentials are not needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def unhandled_handler(_: Request, exc: Exception):
    logger.error("Unhandled error: %s", type(exc).__name__)  # type only: messages may contain user data
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our side."})


@app.get("/health")
def health():
    return {"status": "ok"}


for module in (auth, resumes, jobs, analysis, assistant, applications, dashboard):
    app.include_router(module.router, prefix="/api")
