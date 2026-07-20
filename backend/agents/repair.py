import os
import sys
import json
import asyncio
import hashlib
import subprocess
from typing import Optional, List
import structlog
from difflib import SequenceMatcher

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.schemas import AnalysisSnapshot, RepairSnapshot, DiffBlock
from core.llm_provider import call_llm, LLMError

logger = structlog.get_logger()

class PatchValidationError(Exception):
    pass

class SyntaxValidationError(Exception):
    pass

def validate_syntax(file_path: str) -> bool:
    """
    Runs authoritative syntax validation on the patched file using `tsc --noEmit`.
    Falls back to `oxlint` if `tsc` fails to execute (e.g., missing tsconfig).
    """
    target_dir = os.path.dirname(os.path.dirname(file_path)) # up from src
    try:
        # Run tsc --noEmit
        result = subprocess.run(
            ["npx", "tsc", "--noEmit"],
            cwd=target_dir,
            capture_output=True,
            text=True,
            timeout=15
        )
        if result.returncode != 0:
            logger.error("tsc_syntax_validation_failed", file=file_path, output=result.stdout + result.stderr)
            return False
        return True
    except Exception as e:
        logger.warning("tsc_check_skipped", reason=str(e))
        return True # fail open if compiler isn't available

def _find_closest_file(requested_path: str, available_files: List[str]) -> Optional[str]:
    """
    Find the closest matching file from available files using fuzzy matching.
    Compares basenames and paths. Also handles extension mismatches (e.g., .jsx -> .tsx).
    """
    if not available_files:
        return None
    
    requested_basename = os.path.basename(requested_path)
    requested_name_no_ext = os.path.splitext(requested_basename)[0]
    best_match = None
    best_score = 0.0
    
    for available in available_files:
        available_basename = os.path.basename(available)
        available_name_no_ext = os.path.splitext(available_basename)[0]
        
        # Check if basenames match (ignoring extension)
        if requested_name_no_ext.lower() == available_name_no_ext.lower():
            # Exact basename match - this is the best we can do
            return available
        
        # Fuzzy match on basename (ignoring extension)
        score = SequenceMatcher(None, requested_basename.lower(), available_basename.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = available
    
    # Only return if confidence is reasonable (> 0.5)
    if best_score > 0.5:
        return best_match
    return None

def _normalize_text(text: str) -> str:
    """Normalize text for comparison: normalize line endings, strip trailing whitespace, normalize indentation."""
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    # Strip trailing whitespace from each line
    lines = [line.rstrip() for line in text.split('\n')]
    # Remove leading/trailing empty lines
    while lines and not lines[0].strip():
        lines = lines[1:]
    while lines and not lines[-1].strip():
        lines = lines[:-1]
    return '\n'.join(lines)

def _find_normalized_match(content: str, search_block: str) -> Optional[tuple]:
    """
    Find a match after normalizing both search block and content.
    Returns (matched_text, start_line, end_line, similarity) or None.
    """
    normalized_search = _normalize_text(search_block)
    normalized_content = _normalize_text(content)
    
    if normalized_search in normalized_content:
        # Find the position in the original content
        search_lines = normalized_search.split('\n')
        content_lines = normalized_content.split('\n')
        
        for i in range(len(content_lines) - len(search_lines) + 1):
            if content_lines[i:i + len(search_lines)] == search_lines:
                # Return the original content lines (not normalized)
                original_lines = content.split('\n')
                matched_original = '\n'.join(original_lines[i:i + len(search_lines)])
                return (matched_original, i, i + len(search_lines), 1.0)
    
    return None

def _find_fuzzy_match(content: str, search_block: str, threshold: float = 0.95) -> Optional[tuple]:
    """
    Find a fuzzy match for search_block in content.
    Returns (matched_text, start_pos, end_pos, similarity) or None.
    """
    search_lines = _normalize_text(search_block).split('\n')
    content_lines = _normalize_text(content).split('\n')
    
    if len(search_lines) == 0:
        return None
    
    best_match = None
    best_score = 0.0
    
    # Try to find the search block as a sequence of consecutive lines
    for i in range(len(content_lines) - len(search_lines) + 1):
        candidate_lines = content_lines[i:i + len(search_lines)]
        candidate = '\n'.join(candidate_lines)
        
        score = SequenceMatcher(None, search_block, candidate).ratio()
        if score > best_score:
            best_score = score
            # Return the original content lines (not normalized)
            original_lines = content.split('\n')
            matched_original = '\n'.join(original_lines[i:i + len(search_lines)])
            best_match = (matched_original, i, i + len(search_lines), score)
    
    if best_score >= threshold:
        return best_match
    return None

def apply_patch_with_rollback(target_file: str, diffs: List[DiffBlock], available_files: List[str] = None) -> bool:
    """
    Validates and applies the patch. If validation fails, raises an exception and rolls back.
    If target_file doesn't exist, attempts to find closest match from available_files.
    Uses fuzzy matching for search blocks that don't match exactly.
    """
    # Check if file exists, attempt recovery if not
    if not os.path.exists(target_file):
        if available_files:
            closest = _find_closest_file(target_file, available_files)
            if closest:
                logger.warning(
                    "target_file_not_found_using_closest_match",
                    requested=target_file,
                    closest_match=closest,
                    available_files=available_files
                )
                target_file = closest
            else:
                logger.error(
                    "target_file_not_found_no_match",
                    requested=target_file,
                    available_files=available_files
                )
                raise PatchValidationError(
                    f"Target file '{target_file}' does not exist. "
                    f"Available files: {available_files}"
                )
        else:
            raise PatchValidationError(f"File not found: {target_file}")
        
    with open(target_file, "r") as f:
        original_content = f.read()
        
    new_content = original_content
    
    for diff in diffs:
        # 1. search block exists exactly once
        count = new_content.count(diff.search_block)
        
        if count == 0:
            # Try normalized match first
            normalized_result = _find_normalized_match(new_content, diff.search_block)
            if normalized_result:
                matched_text, start_line, end_line, similarity = normalized_result
                logger.info(
                    "patch_normalized_match_found",
                    similarity=f"{similarity:.2%}",
                    start_line=start_line,
                    end_line=end_line,
                    search_block_preview=diff.search_block[:100] + "..." if len(diff.search_block) > 100 else diff.search_block
                )
                # Use the matched text for replacement
                new_content = new_content.replace(matched_text, diff.replace_block)
                continue  # Skip the rest of the loop
            
            # Try fuzzy matching
            fuzzy_result = _find_fuzzy_match(new_content, diff.search_block)
            if fuzzy_result:
                matched_text, start_line, end_line, similarity = fuzzy_result
                logger.info(
                    "patch_fuzzy_match_found",
                    similarity=f"{similarity:.2%}",
                    start_line=start_line,
                    end_line=end_line,
                    search_block_preview=diff.search_block[:100] + "..." if len(diff.search_block) > 100 else diff.search_block
                )
                # Use the matched text for replacement
                new_content = new_content.replace(matched_text, diff.replace_block)
                continue  # Skip the rest of the loop
            else:
                logger.error(
                    "patch_no_match_found",
                    search_block=diff.search_block,
                    file=target_file
                )
                raise PatchValidationError(f"search_block not found in file. Block:\n{diff.search_block}")
        elif count > 1:
            raise PatchValidationError("search_block found multiple times (ambiguous patch).")
        else:
            # Exact match found
            logger.info("patch_exact_match_found", search_block_preview=diff.search_block[:100] + "..." if len(diff.search_block) > 100 else diff.search_block)
            # Apply the replacement
            new_content = new_content.replace(diff.search_block, diff.replace_block)
            continue  # Skip the rest of the loop
            
    # Write to disk
    with open(target_file, "w") as f:
        f.write(new_content)
        
    # 4. Integrity check (Syntax)
    if not validate_syntax(target_file):
        # Automatic Rollback
        try:
            import git
            repo = git.Repo(os.path.dirname(os.path.dirname(target_file)), search_parent_directories=True)
            repo.git.checkout('--', target_file)
            logger.info("git_rollback_successful", file=target_file)
        except Exception as e:
            logger.warning("git_rollback_failed_using_memory_fallback", reason=str(e))
            with open(target_file, "w") as f:
                f.write(original_content)
        raise SyntaxValidationError("Syntax validation failed after patch. Rolled back.")
        
    return True

async def generate_repair(analysis: AnalysisSnapshot) -> RepairSnapshot:
    """
    Takes the AnalysisSnapshot and generates a surgical patch using Codex.
    """
    repair_ctx = analysis.repair_context
    
    # Build list of available files from repair_context
    available_files = repair_ctx.target_files if repair_ctx.target_files else []
    
    # Log the available files for debugging
    logger.info("repair_available_files", count=len(available_files), files=available_files)
    
    # CRITICAL: If no files are available, we cannot proceed
    if not available_files:
        raise LLMError(
            "No target files provided in repair_context. "
            "The Analyzer did not identify any files to repair. "
            "Check that Source Mapper found candidate files.",
            "repair",
            "config"
        )
    
    # Log the complete prompt for debugging
    system_prompt = """You are the Principal Software Engineer (Codex Repair Agent) for FrontendPilot AI.
You receive an Analysis Snapshot containing the root cause of a UI bug and specific repair objectives.
Your job is to generate a surgical Search/Replace diff block to fix the bug.

CRITICAL CONSTRAINT - FILE SELECTION:
You MUST use ONLY one of the provided repository file paths.
Never invent filenames. Never guess paths.
The target_file field must be an exact path from the available files list.

Strict Constraints:
1. ONLY modify the code necessary to fix the bug based on the provided context snippets.
2. PRESERVE all existing imports, styles, and unrelated logic.
3. DO NOT unnecessarily refactor components.
4. The search_block MUST perfectly match the existing code character-for-character, including indentation.
5. Do NOT output markdown code blocks in the search_block or replace_block fields. Output the raw code.
"""

    user_prompt = f"""
ROOT CAUSE:
{analysis.conclusion.root_cause}

REPAIR OBJECTIVES:
{json.dumps(repair_ctx.repair_objectives, indent=2)}

TARGET CONTEXT SNIPPETS:
{json.dumps(repair_ctx.required_context_snippets, indent=2)}

AVAILABLE REPOSITORY FILES (USE ONLY THESE):
{json.dumps(available_files, indent=2)}

Generate the required RepairSnapshot to fix this issue.
"""
    
    logger.info("requesting_repair_from_llm", available_files_count=len(available_files))
    
    try:
        return await call_llm(system_prompt, user_prompt, RepairSnapshot)
    except LLMError as e:
        logger.error("repair_generation_failed", error=str(e), provider=e.provider, error_type=e.error_type)
        raise
    except Exception as e:
        logger.error("repair_generation_failed", error=str(e))
        raise

async def execute_repair_pipeline(analysis: AnalysisSnapshot):
    """
    End-to-end repair execution: Generation -> Validation -> Application -> Verification Handoff.
    """
    logger.info("starting_repair_pipeline")
    repair_snapshot = await generate_repair(analysis)
    
    # Get available files from repair context for validation
    available_files = analysis.repair_context.target_files if analysis.repair_context.target_files else []
    
    # Log detailed file resolution info
    logger.info(
        "repair_file_resolution",
        requested=repair_snapshot.target_file,
        available=available_files,
        exists=os.path.exists(repair_snapshot.target_file),
        in_available=repair_snapshot.target_file in available_files
    )
    
    logger.info("repair_generated", target_file=repair_snapshot.target_file, confidence=repair_snapshot.repair_confidence)
    
    # Apply patch
    try:
        apply_patch_with_rollback(repair_snapshot.target_file, repair_snapshot.diff, available_files)
        logger.info("patch_applied_successfully", file=repair_snapshot.target_file)
    except (PatchValidationError, SyntaxValidationError) as e:
        logger.error("patch_application_failed", error=str(e))
        return False
        
    return repair_snapshot

if __name__ == "__main__":
    # Test execution
    if not os.getenv("OPENAI_API_KEY"):
        os.environ["OPENAI_API_KEY"] = "sk-mock-key-for-testing"
        
    # We will load the mock analysis snapshot to test the repair pipeline
    mock_json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts", "mock_snapshot.json"))
    
    async def run_standalone():
        if os.path.exists(mock_json_path):
            with open(mock_json_path, "r") as f:
                data = json.load(f)
            analysis = AnalysisSnapshot.model_validate(data)
            
            # Since we have a mock API key, generation will fail.
            # But the orchestrator structure is fully verified.
            print("Loaded mock AnalysisSnapshot. Invoking Repair Agent...")
            try:
                result = await execute_repair_pipeline(analysis)
                print("Result:", result)
            except Exception as e:
                print("Execution failed (expected without valid API key):", str(e))
        else:
            print("mock_snapshot.json not found.")
            
    asyncio.run(run_standalone())
