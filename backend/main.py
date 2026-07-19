import os
import sys
import uvicorn
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is importable
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import init_db
from api.routes import router
from core.llm_provider import LLM_PROVIDER, LLM_MODEL

logger = structlog.get_logger()

app = FastAPI(title="FrontendPilot AI API")

# ---------------------------------------------------------------------------
# CORS — Production-ready configuration.
# Allows local development and deployed Vercel frontend.
# Override via CORS_ORIGINS environment variable (comma-separated).
# ---------------------------------------------------------------------------
default_origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "https://frontend-pilot-ai.vercel.app",
]
cors_origins = os.getenv("CORS_ORIGINS", ",".join(default_origins)).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


# ---------------------------------------------------------------------------
# Root health-check / info endpoint
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "service": "FrontendPilot AI API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }


@app.on_event("startup")
def startup_event():
    init_db()
    logger.info("Starting LLM provider", provider=LLM_PROVIDER, model=LLM_MODEL)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)