from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class StartRequest(BaseModel):
    journey_name: str

@router.post("/workflow/start")
async def start_workflow(req: StartRequest):
    return {"status": "started", "run_id": "test_run_123"}

@router.get("/workflow/status")
async def get_status():
    return {"active_agent": "explorer", "progress": 10}

@router.get("/issues")
async def get_issues():
    return []

@router.post("/repair/{issue_id}")
async def start_repair(issue_id: str):
    return {"status": "repair_started"}

@router.get("/traces/{step_id}")
async def get_trace(step_id: str):
    return {"html": "<html><body>Trace preview</body></html>"}
