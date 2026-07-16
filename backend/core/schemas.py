from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class ExplorerElement(BaseModel):
    element_type: str
    visible_label: str
    selector: str
    is_enabled: bool
    is_visible: bool
    role: Optional[str] = None

class PageSummary(BaseModel):
    title: str
    current_url: str
    total_interactive_elements: int
    button_count: int
    input_count: int
    checkbox_count: int
    link_count: int
    form_count: int

class JourneyStep(BaseModel):
    action: str
    target_selector: Optional[str] = None
    input_value: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ConsoleEvent(BaseModel):
    severity: Literal["info", "warning", "error"]
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class NetworkFailure(BaseModel):
    url: str
    status: int
    method: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ScreenshotReference(BaseModel):
    name: str
    path: str

class ExecutionMetadata(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_seconds: float
    target_url: str
    success: bool

class RuntimeEvidence(BaseModel):
    expected_interaction: str
    observed_dom_change: str
    observed_visual_change: str
    observed_console_events: str
    observed_network_events: str
    observed_element_state: str
    evidence: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ExplorerSnapshot(BaseModel):
    page_url: str
    page_summary: PageSummary
    discovered_elements: List[ExplorerElement]
    detected_journey: List[JourneyStep]
    runtime_evidence: RuntimeEvidence
    console_events: List[ConsoleEvent]
    network_failures: List[NetworkFailure]
    screenshots: List[ScreenshotReference]
    execution_metadata: ExecutionMetadata

class CandidateNode(BaseModel):
    node_type: str
    line_start: int
    line_end: int
    snippet: str
    match_reason: str
    heuristic_confidence: float

class CandidateComponent(BaseModel):
    component_name: str
    matching_nodes: List[CandidateNode]
    heuristic_confidence: float

class CandidateFile(BaseModel):
    file_path: str
    components: List[CandidateComponent]
    heuristic_confidence: float

class SourceSnapshot(BaseModel):
    target_observation: str
    candidate_files: List[CandidateFile]
