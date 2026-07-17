import os
import sys
import json
import time
import asyncio
import structlog
from typing import Optional

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from core.schemas import PipelineExecutionSnapshot, OrchestrationEvent
from agents.explorer import run_explorer
from core.source_mapper import SourceMapper
from agents.analyzer import analyze_failure
from agents.repair import execute_repair_pipeline
from agents.verifier import verify_repair

logger = structlog.get_logger()

class Orchestrator:
    def __init__(self):
        self.snapshot = PipelineExecutionSnapshot(
            overall_status="Error",
            total_runtime_seconds=0.0,
            final_result="Pipeline in progress."
        )
        self.pipeline_start_time = time.time()

    def _log_event(self, stage: str, status: str):
        self.snapshot.events.append(OrchestrationEvent(stage=stage, status=status))
        self.snapshot.execution_history.append(f"{stage} {status.title()}")
        logger.info(f"orchestrator_event", stage=stage, status=status)

    async def run_pipeline(self) -> PipelineExecutionSnapshot:
        """
        Executes the complete autonomous engineering workflow as a pure coordinator.
        """
        try:
            # ---------------------------------------------------------
            # 1. EXPLORER
            # ---------------------------------------------------------
            stage = "Explorer"
            self._log_event(stage, "started")
            t0 = time.time()
            exp_snap = await run_explorer()
            self.snapshot.stage_metrics[stage] = round(time.time() - t0, 2)
            self.snapshot.explorer_snapshot = exp_snap
            
            if not exp_snap.execution_metadata.success:
                self._log_event(stage, "failed")
                self.snapshot.final_result = "Explorer encountered a framework-level error."
                return self._finalize("Failed")
            self._log_event(stage, "completed")

            # ---------------------------------------------------------
            # 2. SOURCE MAPPER
            # ---------------------------------------------------------
            stage = "Source Mapper"
            self._log_event(stage, "started")
            t0 = time.time()
            mapper = SourceMapper()
            src_snap = mapper.run(exp_snap)
            self.snapshot.stage_metrics[stage] = round(time.time() - t0, 2)
            self.snapshot.source_snapshot = src_snap
            self._log_event(stage, "completed")
            
            # ---------------------------------------------------------
            # 3. ANALYZER
            # ---------------------------------------------------------
            stage = "Analyzer"
            self._log_event(stage, "started")
            t0 = time.time()
            try:
                analysis_snap = await analyze_failure(exp_snap, src_snap)
                self.snapshot.stage_metrics[stage] = round(time.time() - t0, 2)
                self.snapshot.analysis_snapshot = analysis_snap
                self._log_event(stage, "completed")
            except Exception as e:
                self.snapshot.stage_metrics[stage] = round(time.time() - t0, 2)
                self._log_event(stage, "failed")
                self._log_event("Repair", "skipped")
                self._log_event("Verifier", "skipped")
                self.snapshot.final_result = f"Analyzer failed: {str(e)}"
                return self._finalize("Failed")

            # ---------------------------------------------------------
            # 4. REPAIR
            # ---------------------------------------------------------
            stage = "Repair"
            self._log_event(stage, "started")
            t0 = time.time()
            repair_snap = await execute_repair_pipeline(analysis_snap)
            self.snapshot.stage_metrics[stage] = round(time.time() - t0, 2)
            
            if not repair_snap:
                self._log_event(stage, "failed")
                self._log_event("Verifier", "skipped")
                self.snapshot.final_result = "Repair Agent failed to generate or apply a valid patch."
                return self._finalize("Failed")
                
            self.snapshot.repair_snapshot = repair_snap
            self._log_event(stage, "completed")

            # ---------------------------------------------------------
            # 5. VERIFIER
            # ---------------------------------------------------------
            stage = "Verifier"
            self._log_event(stage, "started")
            t0 = time.time()
            verification_snap = await verify_repair(exp_snap, repair_snap)
            self.snapshot.stage_metrics[stage] = round(time.time() - t0, 2)
            self.snapshot.verification_snapshot = verification_snap
            
            # ---------------------------------------------------------
            # ROLLBACK & FINALIZE
            # ---------------------------------------------------------
            if verification_snap.rollback_required:
                self._log_event(stage, "failed")
                logger.error("verification_failed_rollback_triggered")
                try:
                    import git
                    repo = git.Repo(os.path.dirname(os.path.dirname(repair_snap.target_file)), search_parent_directories=True)
                    repo.git.checkout('--', repair_snap.target_file)
                    logger.info("orchestrator_git_rollback_successful", file=repair_snap.target_file)
                except Exception as e:
                    logger.warning("orchestrator_git_rollback_failed", reason=str(e))
                self.snapshot.final_result = "Verification failed. Code was rolled back."
                return self._finalize("Failed")
            else:
                self._log_event(stage, "completed")
                self.snapshot.final_result = "Pipeline completed successfully. Code is patched."
                return self._finalize("Success")

        except Exception as e:
            logger.exception("pipeline_fatal_error", error=str(e))
            self.snapshot.final_result = f"Pipeline encountered fatal exception: {str(e)}"
            return self._finalize("Error")

    def _finalize(self, status: str) -> PipelineExecutionSnapshot:
        self.snapshot.overall_status = status
        self.snapshot.total_runtime_seconds = round(time.time() - self.pipeline_start_time, 2)
        logger.info("pipeline_completed", status=self.snapshot.overall_status, duration=self.snapshot.total_runtime_seconds)
        return self.snapshot

if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = "sk-mock-key-for-testing"
        
    async def main():
        print("Starting Refined Standalone Orchestrator...")
        orchestrator = Orchestrator()
        result = await orchestrator.run_pipeline()
        
        # Write to JSON file for output evaluation
        artifacts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts"))
        os.makedirs(artifacts_dir, exist_ok=True)
        out_path = os.path.join(artifacts_dir, "pipeline_execution.json")
        with open(out_path, "w") as f:
            f.write(result.model_dump_json(indent=2))
            
        print(f"\nPipeline executed. Status: {result.overall_status}")
        print(f"Final Result: {result.final_result}")
        print(f"Total Runtime: {result.total_runtime_seconds}s")
        print("\nStage Metrics:")
        for stage, metric in result.stage_metrics.items():
            print(f"- {stage}: {metric}s")
        print("\nPipeline Trace:")
        for history in result.execution_history:
            print(f"- {history}")
        print(f"\nFull output saved to {out_path}")
        
    asyncio.run(main())
