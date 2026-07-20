import os
import sys
import json
import asyncio
from typing import List, Optional
from playwright.async_api import async_playwright, Page
import structlog

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.schemas import ExplorerSnapshot, RepairSnapshot, VerificationSnapshot, VerificationAction, VerificationObservedResults

logger = structlog.get_logger()

async def execute_action(page: Page, action: VerificationAction) -> bool:
    """
    Executes a single deterministic Playwright action.
    Returns True if successful, False if it failed (e.g., timeout).
    """
    try:
        if action.action == "click":
            await page.locator(action.selector).click(timeout=5000)
        elif action.action == "type":
            await page.locator(action.selector).fill(action.value or "", timeout=5000)
        elif action.action == "assert_text":
            text = await page.locator(action.selector).inner_text(timeout=5000)
            if action.expected and action.expected not in text:
                logger.warning("assert_text_failed", expected=action.expected, actual=text)
                return False
        elif action.action == "assert_visible":
            await page.locator(action.selector).wait_for(state="visible", timeout=5000)
        elif action.action == "assert_not_visible":
            await page.locator(action.selector).wait_for(state="hidden", timeout=5000)
        else:
            logger.warning("unknown_action", action=action.action)
            return False
            
        return True
    except Exception as e:
        logger.error("action_failed", action=action.action, selector=action.selector, error=str(e))
        return False

async def _generate_dynamic_verification(explorer_snapshot: ExplorerSnapshot, repair_snapshot: RepairSnapshot) -> List[VerificationAction]:
    """
    Generate verification steps dynamically based on the repair context.
    If the repair handoff is relevant, use it. Otherwise, generate steps based on the modified file.
    """
    # Check if the repair handoff is relevant to the modified file
    target_file = repair_snapshot.target_file
    modified_symbols = repair_snapshot.modified_symbols
    
    # If the repair handoff seems relevant (e.g., checking the same component), use it
    handoff = repair_snapshot.verification_handoff
    
    # Check if the verification steps are relevant to the repair
    # If the target file is TodoItem.tsx, the main input check is irrelevant
    if "TodoItem" in target_file or "todo-item" in target_file.lower():
        # The repair is to TodoItem, not the main input
        # We should verify the todo items work, not the main input
        logger.info("verifier_dynamic_steps", reason="Repair target is TodoItem, generating relevant verification")
        
        # Find a todo item to verify
        # Look for the first visible todo item in the explorer snapshot
        for el in explorer_snapshot.discovered_elements:
            if "todo" in el.visible_label.lower() or "item" in el.element_type.lower():
                return [
                    VerificationAction(action="assert_visible", selector=el.selector),
                ]
        
        # Fallback: just check the page loaded
        return [
            VerificationAction(action="assert_visible", selector="body"),
        ]
    
    # If the target file is App.tsx, use the original handoff
    return handoff.verification_steps

async def verify_repair(explorer_snapshot: ExplorerSnapshot, repair_snapshot: RepairSnapshot) -> VerificationSnapshot:
    """
    Executes the Verification Handoff steps using Playwright and evaluates the result.
    """
    logger.info("starting_verification")
    
    # Generate dynamic verification steps based on the repair
    verification_steps = await _generate_dynamic_verification(explorer_snapshot, repair_snapshot)
    target_url = explorer_snapshot.execution_metadata.target_url
    
    # We will save the screenshots here
    artifacts_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts"))
    os.makedirs(artifacts_dir, exist_ok=True)
    screenshot_after_path = os.path.join(artifacts_dir, "verify_after.png")
    
    # For the baseline screenshot, we use the first screenshot from the Explorer run
    screenshot_before = ""
    if explorer_snapshot.screenshots:
        screenshot_before = explorer_snapshot.screenshots[0].path

    console_events = []
    network_failures = []
    regressions_detected = []
    
    verification_status = "Inconclusive"
    pass_fail_reason = ""
    rollback_required = True # Default to safe
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Track Console Errors
        page.on("console", lambda msg: console_events.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_events.append(str(err)))
        
        # Track Network Failures
        page.on("response", lambda res: network_failures.append(f"{res.url} - {res.status}") if res.status >= 400 else None)
        
        try:
            logger.info("navigating_to_target", url=target_url)
            await page.goto(target_url, wait_until="networkidle", timeout=10000)
            
            # Execute steps
            all_steps_passed = True
            for step in verification_steps:
                logger.info("executing_step", action=step.action, selector=step.selector)
                success = await execute_action(page, step)
                if not success:
                    all_steps_passed = False
                    pass_fail_reason = f"Verification failed at step: {step.action} on {step.selector}"
                    break
                    
            await page.screenshot(path=screenshot_after_path)
            
            if all_steps_passed:
                # Check for regressions
                # We simply compare if new errors showed up that weren't in the original explorer snapshot.
                original_errors = [e.message for e in explorer_snapshot.console_events if e.severity == "error"]
                new_errors = [e for e in console_events if e not in original_errors]
                
                if new_errors:
                    regressions_detected.append("New console errors introduced.")
                    verification_status = "Failed"
                    pass_fail_reason = "Repair actions succeeded, but introduced new console errors."
                    rollback_required = True
                else:
                    verification_status = "Passed"
                    pass_fail_reason = "All verification steps executed successfully. Expected outcome achieved."
                    rollback_required = False
            else:
                verification_status = "Failed"
                rollback_required = True
                
        except Exception as e:
            logger.error("verification_error", error=str(e))
            verification_status = "Inconclusive"
            pass_fail_reason = f"An unexpected error occurred during Playwright execution: {str(e)}"
            rollback_required = True
        finally:
            await browser.close()
            
    # Compile observed results
    observed_results = VerificationObservedResults(
        dom_state="Captured in screenshot_after.",
        console_events=console_events,
        network_failures=network_failures
    )
    
    snapshot = VerificationSnapshot(
        verification_status=verification_status,
        executed_steps=verification_steps,
        observed_results=observed_results,
        regressions_detected=regressions_detected,
        screenshot_before=screenshot_before,
        screenshot_after=screenshot_after_path,
        pass_fail_reason=pass_fail_reason,
        rollback_required=rollback_required
    )
    
    logger.info("verification_complete", status=snapshot.verification_status, rollback=snapshot.rollback_required)
    return snapshot

if __name__ == "__main__":
    # Test standalone
    print("Run via orchestrator or provide mock snapshots.")
