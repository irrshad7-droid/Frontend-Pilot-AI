import os
import sys
import json
import asyncio
from typing import Optional
import structlog

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.schemas import ExplorerSnapshot, SourceSnapshot, AnalysisSnapshot
from core.llm_provider import call_llm, LLMError

logger = structlog.get_logger()

async def analyze_failure(explorer_snapshot: ExplorerSnapshot, source_snapshot: SourceSnapshot) -> AnalysisSnapshot:
    """
    Analyzes the failure by combining Explorer evidence with Source Mapper candidates.
    Outputs a structured AnalysisSnapshot predicting the root cause.
    """
    # We serialize the snapshots to JSON, stripping out giant unneeded fields if necessary.
    # In this case, ExplorerSnapshot and SourceSnapshot are already heavily curated by the pipeline.
    
    # Extract available files from Source Mapper
    available_files = [f.file_path for f in source_snapshot.candidate_files]
    
    system_prompt = """You are the Principal Software Architect and Lead Frontend QA Engineer for FrontendPilot AI.
You are investigating a runtime failure in a React application.

You must follow this exact reasoning sequence:
1. Evidence Correlation
2. Evidence Graph
3. Generate 2-3 competing hypotheses
4. Evaluate supporting evidence
5. Evaluate contradicting evidence
6. Eliminate weaker hypotheses
7. Produce a convergent investigation
8. Generate Repair Context

CRITICAL CONSTRAINT - FILE SELECTION:
The repair_context.target_files field MUST contain only file paths from the SOURCE CANDIDATES list.
Never invent filenames. Never guess paths.
Use the exact paths provided in the candidate_files.

Do not jump to conclusions. You must discover the most plausible explanation purely from the supplied evidence.
Do not hallucinate. Do not output anything other than the required JSON structure.
Be extremely precise.
"""

    user_prompt = f"""
RUNTIME EVIDENCE (ExplorerSnapshot):
{explorer_snapshot.model_dump_json(indent=2)}

SOURCE CANDIDATES (SourceSnapshot):
{source_snapshot.model_dump_json(indent=2)}

AVAILABLE FILES (USE ONLY THESE):
{json.dumps(available_files, indent=2)}

Analyze this failure and return the structured AnalysisSnapshot.
"""

    logger.info("requesting_analysis_from_llm")
    
    try:
        return await call_llm(system_prompt, user_prompt, AnalysisSnapshot)
    except LLMError as e:
        logger.error("analysis_failed", error=str(e), provider=e.provider, error_type=e.error_type)
        raise
    except Exception as e:
        logger.error("analysis_failed", error=str(e))
        raise

if __name__ == "__main__":
    from agents.explorer import run_explorer
    from core.source_mapper import SourceMapper
    
    async def standalone_test():
        print("Running Explorer to gather runtime evidence...")
        exp_snap = await run_explorer()
        
        print(f"Explorer finished. Success: {exp_snap.execution_metadata.success}")
        
        # We need something to query the source mapper with.
        # Let's take the first button we tried to click or interact with.
        target_label = "Add"
        target_type = "button"
        for step in exp_snap.detected_journey:
            if step.action == "click_submit":
                # Find the element
                for el in exp_snap.discovered_elements:
                    if el.selector == step.target_selector:
                        target_label = el.visible_label
                        target_type = el.element_type
                        break

        print(f"Running Source Mapper for '{target_label}' ({target_type})...")
        mapper = SourceMapper()
        src_snap = mapper.find_candidates(target_label=target_label, target_element_type=target_type)
        
        print("Running Analyzer...")
        analysis = await analyze_failure(exp_snap, src_snap)
        
        print("\n" + "="*40)
        print("Investigation Complete")
        print("="*40)
        print(f"Root Cause: {analysis.conclusion.root_cause}")
        print(f"Confidence: {analysis.conclusion.investigation_confidence}")
        print("\nFull Analysis Snapshot:")
        print(analysis.model_dump_json(indent=2))
        
    # Set a dummy API key if none exists so the script doesn't instantly crash before OpenAI call
    if not os.getenv("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = "sk-mock-key-for-testing"
        
    asyncio.run(standalone_test())
