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

class EvidenceItem(BaseModel):
    item: str
    provenance: str

class EvidenceGraph(BaseModel):
    relationships: List[str]

class Hypothesis(BaseModel):
    hypothesis: str
    supporting_evidence: List[str]
    contradicting_evidence: List[str]
    plausibility_score: Literal["High", "Medium", "Low"]

class AnalyzerConclusion(BaseModel):
    root_cause: str
    confidence_rationale: str
    investigation_confidence: Literal["High", "Medium", "Low"]

class RepairContext(BaseModel):
    target_files: List[str]
    target_components: List[str]
    required_context_snippets: List[str]
    repair_objectives: List[str]

class AnalysisSnapshot(BaseModel):
    observed_behavior: str
    evidence_evaluated: List[EvidenceItem]
    evidence_graph: EvidenceGraph
    competing_hypotheses: List[Hypothesis]
    conclusion: AnalyzerConclusion
    repair_context: RepairContext
    unknowns: List[str]
    assumptions: List[str]

class DiffBlock(BaseModel):
    search_block: str
    replace_block: str

class VerificationAction(BaseModel):
    action: Literal["click", "type", "assert_text", "assert_visible", "assert_not_visible"]
    selector: str
    value: Optional[str] = None
    expected: Optional[str] = None

class VerificationHandoff(BaseModel):
    expected_outcome: str
    verification_steps: List[VerificationAction]

class RepairSnapshot(BaseModel):
    target_file: str
    patch_explanation: str
    modified_symbols: List[str]
    diff: List[DiffBlock]
    repair_confidence: Literal["High", "Medium", "Low"]
    repair_risks: List[str]
    verification_handoff: VerificationHandoff

class VerificationObservedResults(BaseModel):
    dom_state: str
    console_events: List[str]
    network_failures: List[str]

class VerificationSnapshot(BaseModel):
    verification_status: Literal["Passed", "Failed", "Inconclusive"]
    executed_steps: List[VerificationAction]
    observed_results: VerificationObservedResults
    regressions_detected: List[str]
    screenshot_before: str
    screenshot_after: str
    pass_fail_reason: str
    rollback_required: bool


class OrchestrationEvent(BaseModel):
    stage: str
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PipelineExecutionSnapshot(BaseModel):
    explorer_snapshot: Optional[ExplorerSnapshot] = None
    source_snapshot: Optional[SourceSnapshot] = None
    analysis_snapshot: Optional[AnalysisSnapshot] = None
    repair_snapshot: Optional[RepairSnapshot] = None
    verification_snapshot: Optional[VerificationSnapshot] = None
    
    stage_metrics: dict[str, float] = Field(default_factory=dict)
    execution_history: List[str] = Field(default_factory=list)
    events: List[OrchestrationEvent] = Field(default_factory=list)
    
    overall_status: Literal["Success", "Failed", "Error"]
    total_runtime_seconds: float
    final_result: str
