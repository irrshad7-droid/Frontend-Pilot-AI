import os
import sys
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Ensure backend root is on sys.path for sibling imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from orchestrator import Orchestrator
from core.schemas import PipelineExecutionSnapshot, ProviderStatusResponse
from core.llm_provider import get_provider_status

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory run registry (hackathon MVP — no external queue needed)
# ---------------------------------------------------------------------------

class RunRecord:
    """Tracks a single pipeline execution."""
    def __init__(self, run_id: str, target_url: Optional[str] = None):
        self.run_id = run_id
        self.status = "Running"
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.updated_at = self.created_at
        self.error: Optional[str] = None
        self.target_url = target_url
        self.orchestrator = Orchestrator()
        self.task: Optional[asyncio.Task] = None

    @property
    def snapshot(self) -> PipelineExecutionSnapshot:
        return self.orchestrator.snapshot

_runs: Dict[str, RunRecord] = {}


async def _execute_run(record: RunRecord):
    """Background coroutine — runs the full pipeline and updates the record."""
    try:
        result = await record.orchestrator.run_pipeline()
        record.status = result.overall_status       # "Success" | "Failed" | "Error"
        record.updated_at = datetime.now(timezone.utc).isoformat()
    except Exception as exc:
        record.status = "Error"
        record.error = str(exc)
        record.updated_at = datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class StartRequest(BaseModel):
    target_url: Optional[str] = None   # Optional override for TARGET_APP_URL


class StartResponse(BaseModel):
    run_id: str
    status: str


class RunStatusResponse(BaseModel):
    run_id: str
    status: str
    created_at: str
    updated_at: str
    error: Optional[str] = None
    # The full snapshot is serialized inline so the frontend has everything
    snapshot: Optional[PipelineExecutionSnapshot] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/workflow/start", response_model=StartResponse)
async def start_workflow(req: StartRequest):
    """Start a new pipeline execution asynchronously."""
    run_id = f"run_{uuid.uuid4().hex[:12]}"

    # Optionally propagate target_url into the environment for Explorer.
    # This does NOT redesign Explorer — Explorer already reads TARGET_APP_URL.
    if req.target_url:
        os.environ["TARGET_APP_URL"] = req.target_url

    record = RunRecord(run_id=run_id, target_url=req.target_url)
    _runs[run_id] = record

    # Launch pipeline as a fire-and-forget background task
    record.task = asyncio.create_task(_execute_run(record))

    return StartResponse(run_id=run_id, status="Running")


def sanitize_snapshot_paths(snapshot: Optional[PipelineExecutionSnapshot]) -> Optional[PipelineExecutionSnapshot]:
    if not snapshot:
        return None
    
    snap = snapshot.model_copy(deep=True)
    
    if snap.explorer_snapshot and snap.explorer_snapshot.screenshots:
        for scr in snap.explorer_snapshot.screenshots:
            if scr.path:
                scr.path = f"/api/artifacts/{os.path.basename(scr.path)}"
                
    if snap.verification_snapshot:
        if snap.verification_snapshot.screenshot_before:
            snap.verification_snapshot.screenshot_before = f"/api/artifacts/{os.path.basename(snap.verification_snapshot.screenshot_before)}"
        if snap.verification_snapshot.screenshot_after:
            snap.verification_snapshot.screenshot_after = f"/api/artifacts/{os.path.basename(snap.verification_snapshot.screenshot_after)}"
            
    return snap


@router.get("/workflow/{run_id}", response_model=RunStatusResponse)
async def get_run(run_id: str):
    """Return the current state of a pipeline run."""
    record = _runs.get(run_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")

    return RunStatusResponse(
        run_id=record.run_id,
        status=record.status,
        created_at=record.created_at,
        updated_at=record.updated_at,
        error=record.error,
        snapshot=sanitize_snapshot_paths(record.snapshot),
    )


# ---------------------------------------------------------------------------
# Artifact / Screenshot serving
# ---------------------------------------------------------------------------

ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts"))


@router.get("/artifacts/{filename}")
async def get_artifact(filename: str):
    """Serve a file from the artifacts directory.
    Only allows files directly inside ARTIFACTS_DIR (no directory traversal).
    """
    # Prevent path traversal
    safe_name = os.path.basename(filename)
    file_path = os.path.join(ARTIFACTS_DIR, safe_name)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Artifact not found.")
    return FileResponse(file_path)


@router.get("/providers/status", response_model=ProviderStatusResponse)
async def get_providers_status():
    """Return the status of all configured LLM providers."""
    status = await get_provider_status()
    return ProviderStatusResponse(providers=status)
