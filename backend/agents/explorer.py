import os
import sys
import asyncio
from datetime import datetime, timezone
import structlog
from playwright.async_api import async_playwright

# Add core to path if running standalone
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from core.schemas import (
    ExplorerSnapshot, ExplorerElement, JourneyStep, 
    ConsoleEvent, NetworkFailure, ScreenshotReference, ExecutionMetadata,
    PageSummary, RuntimeEvidence
)

logger = structlog.get_logger()

TARGET_APP_URL = os.getenv("TARGET_APP_URL", "http://localhost:5173")
ARTIFACTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts"))

async def run_explorer() -> ExplorerSnapshot:
    start_time = datetime.now(timezone.utc)
    console_events = []
    network_failures = []
    discovered_elements = []
    detected_journey = []
    screenshots = []
    
    # Initialize objects with defaults in case of catastrophic failure
    page_summary = PageSummary(
        title="Unknown", current_url=TARGET_APP_URL, total_interactive_elements=0,
        button_count=0, input_count=0, checkbox_count=0, link_count=0, form_count=0
    )
    runtime_evidence = RuntimeEvidence(
        expected_interaction="Add a new item and toggle it.",
        observed_dom_change="Unknown",
        observed_visual_change="Unknown",
        observed_console_events="Unknown",
        observed_network_events="Unknown",
        observed_element_state="Unknown",
        evidence="Initialization failed"
    )

    logger.info("launching_explorer", target_url=TARGET_APP_URL)

    async with async_playwright() as p:
        browser = None
        try:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            # Listen to console
            page.on("console", lambda msg: console_events.append(
                ConsoleEvent(
                    severity=msg.type if msg.type in ["info", "warning", "error"] else "info",
                    message=msg.text,
                    timestamp=datetime.now(timezone.utc)
                )
            ))

            # Listen to network failures
            page.on("response", lambda response: network_failures.append(
                NetworkFailure(
                    url=response.url,
                    status=response.status,
                    method=response.request.method,
                    timestamp=datetime.now(timezone.utc)
                )
            ) if response.status >= 400 else None)

            # Navigate and wait for interactive
            await page.goto(TARGET_APP_URL, wait_until="networkidle")
            page_title = await page.title()
            current_url = page.url
            
            # Take BEFORE screenshot
            before_path = os.path.join(ARTIFACTS_DIR, "before.png")
            await page.screenshot(path=before_path)
            if os.path.exists(before_path):
                screenshots.append(ScreenshotReference(name="before", path=before_path))

            # DOM Discovery
            raw_elements = await page.evaluate('''() => {
                const interactives = Array.from(document.querySelectorAll('h1, h2, h3, a, button, input, textarea, select, form, [role="button"], [role="checkbox"], [tabindex], div[class*="cursor-pointer"]'));
                return interactives.map((el, index) => {
                    // Assign a unique temp attribute for easy selector targeting
                    el.setAttribute('data-explorer-id', 'element-' + index);
                    const type = el.tagName.toLowerCase();
                    let label = el.innerText || el.getAttribute('aria-label') || el.value || el.placeholder || '';
                    return {
                        element_type: type,
                        visible_label: label.trim().substring(0, 50),
                        selector: '[data-explorer-id="element-' + index + '"]',
                        is_enabled: !el.disabled,
                        is_visible: el.offsetWidth > 0 && el.offsetHeight > 0,
                        role: el.getAttribute('role') || null
                    };
                });
            }''')

            for el in raw_elements:
                discovered_elements.append(ExplorerElement(**el))
            
            # Page Summary Calculation
            page_summary = PageSummary(
                title=page_title,
                current_url=current_url,
                total_interactive_elements=len(discovered_elements),
                button_count=sum(1 for e in discovered_elements if e.element_type == "button" or e.role == "button"),
                input_count=sum(1 for e in discovered_elements if e.element_type == "input"),
                checkbox_count=sum(1 for e in discovered_elements if e.role == "checkbox" or e.element_type == "checkbox"),
                link_count=sum(1 for e in discovered_elements if e.element_type == "a"),
                form_count=sum(1 for e in discovered_elements if e.element_type == "form")
            )

            logger.info("elements_discovered", count=len(discovered_elements))

            # Journey Discovery & Execution
            input_el = next((e for e in discovered_elements if e.element_type == "input" and e.is_visible), None)
            
            action_text = "Hackathon Test Todo"
            if input_el:
                await page.fill(input_el.selector, action_text)
                detected_journey.append(JourneyStep(
                    action="type_input",
                    target_selector=input_el.selector,
                    input_value=action_text
                ))
                
                # Submit
                submit_el = next((e for e in discovered_elements if e.element_type == "button" and e.is_visible and "add" in e.visible_label.lower()), None)
                if submit_el:
                    await page.click(submit_el.selector)
                    detected_journey.append(JourneyStep(action="click_submit", target_selector=submit_el.selector))
                else:
                    await page.keyboard.press("Enter")
                    detected_journey.append(JourneyStep(action="press_enter"))

                # Wait for potential async state update
                await page.wait_for_timeout(2500)

                # Find uncompleted item
                await page.evaluate('''() => {
                    const interactives = Array.from(document.querySelectorAll('div[class*="cursor-pointer"], [role="checkbox"], button'));
                    interactives.forEach((el, index) => {
                        el.setAttribute('data-explorer-after', 'after-' + index);
                    });
                }''')
                
                checkbox_sel = 'div[class*="cursor-pointer"][data-explorer-after], [role="checkbox"][data-explorer-after]'
                try:
                    await page.click(checkbox_sel, timeout=1000)
                    detected_journey.append(JourneyStep(action="toggle_checkbox", target_selector=checkbox_sel))
                except Exception:
                    logger.warning("no_checkbox_found_for_toggle")

            # Final wait
            await page.wait_for_timeout(1000)

            # Take AFTER screenshot
            after_path = os.path.join(ARTIFACTS_DIR, "after.png")
            await page.screenshot(path=after_path)
            if os.path.exists(after_path):
                screenshots.append(ScreenshotReference(name="after", path=after_path))
            
            # Observe Runtime Outcome (Factually)
            page_text = await page.content()
            has_todo = action_text in page_text
            has_completed = "line-through" in page_text
            
            dom_change = f"Text '{action_text}' {'was' if has_todo else 'was not'} found in DOM."
            visual_change = f"'line-through' class {'was' if has_completed else 'was not'} detected on page."
            console_msg = f"{len(console_events)} console events recorded."
            network_msg = f"{len(network_failures)} network failures recorded."
            el_state = "Checkbox clicked." if checkbox_sel else "Checkbox not found."
            
            runtime_evidence = RuntimeEvidence(
                expected_interaction="Add a new item and toggle it.",
                observed_dom_change=dom_change,
                observed_visual_change=visual_change,
                observed_console_events=console_msg,
                observed_network_events=network_msg,
                observed_element_state=el_state,
                evidence=f"DOM content length: {len(page_text)} bytes"
            )
            
            success = True

        except Exception as e:
            logger.error("explorer_failed", error=str(e))
            success = False
            runtime_evidence.evidence = f"Execution crashed: {str(e)}"
        finally:
            if browser:
                await browser.close()
    
    end_time = datetime.now(timezone.utc)
    duration_seconds = (end_time - start_time).total_seconds()

    snapshot = ExplorerSnapshot(
        page_url=TARGET_APP_URL,
        page_summary=page_summary,
        discovered_elements=discovered_elements,
        detected_journey=detected_journey,
        runtime_evidence=runtime_evidence,
        console_events=console_events,
        network_failures=network_failures,
        screenshots=screenshots,
        execution_metadata=ExecutionMetadata(
            start_time=start_time,
            end_time=end_time,
            duration_seconds=duration_seconds,
            target_url=TARGET_APP_URL,
            success=success
        )
    )
    
    return snapshot

if __name__ == "__main__":
    snapshot = asyncio.run(run_explorer())
    
    # Print the requested summary
    print("\n" + "="*40)
    print("Explorer Summary")
    print("="*40)
    print(f"- Interactive elements discovered: {snapshot.page_summary.total_interactive_elements}")
    print(f"- Journey executed: {'Success' if snapshot.execution_metadata.success else 'Failed'}")
    print(f"- Expected interaction: {snapshot.runtime_evidence.expected_interaction}")
    print(f"- Observed DOM change: {snapshot.runtime_evidence.observed_dom_change}")
    print(f"- Observed visual change: {snapshot.runtime_evidence.observed_visual_change}")
    print(f"- Console events: {len(snapshot.console_events)}")
    print(f"- Network failures: {len(snapshot.network_failures)}")
    print(f"- Screenshots saved: {'Yes' if len(snapshot.screenshots) == 2 else 'No'}")
    print("="*40 + "\n")
    
    # Print JSON
    print(snapshot.model_dump_json(indent=2))
