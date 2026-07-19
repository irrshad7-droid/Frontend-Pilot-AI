import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is importable
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from database import init_db
from api.routes import router

app = FastAPI(title="FrontendPilot AI API")

# ---------------------------------------------------------------------------
# CORS — Development-only permissive configuration.
# In production, replace allow_origins with explicit frontend origin(s).
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://frontend-pilot-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")

@app.on_event("startup")
def startup_event():
    init_db()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
