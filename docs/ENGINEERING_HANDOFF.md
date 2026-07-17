# FrontendPilot AI — Engineering Handoff

**Author**: Lead Staff Engineer  
**Recipient**: ChatGPT Codex  
**Status**: Frozen architecture / FastAPI bridge and dashboard pending

## 1. Executive Summary

- **Product name**: FrontendPilot AI
- **Elevator pitch**: A local autonomous QA-and-repair pipeline for a React/TypeScript target application. It collects browser evidence, maps an interacted UI element to relevant source snippets, asks an LLM for analysis and an exact-match patch, then verifies supplied Playwright actions.
- **Current implementation boundary**: The backend pipeline modules exist. The FastAPI routes remain mock responses and the `frontend/` application is still the Vite starter screen.
- **Target application**: `target-app/` is a deliberately buggy Todo application used by the Explorer and Verifier at `TARGET_APP_URL` (default `http://localhost:5173`).

## 2. Architecture and Control Flow

The implemented execution order is:

**Explorer** → **Source Mapper** → **Analyzer** → **Repair** → **Verifier** → **Orchestrator finalization**

`Orchestrator.run_pipeline()` invokes functions sequentially: `run_explorer()`, `SourceMapper.run()`, `analyze_failure()`, `execute_repair_pipeline()`, and `verify_repair()`. Agents do not invoke each other during a normal orchestrated run.

All stage handoffs use Pydantic models from `backend/core/schemas.py`. The Analyzer and Repair are the only stages that call an LLM; the Explorer, Source Mapper, Verifier, and Orchestrator are conventional Python/Playwright/Tree-sitter code.

## 3. Implemented Pipeline Behavior

### Explorer (`backend/agents/explorer.py`)

- Launches headless Chromium with Playwright.
- Discovers interactive elements and assigns temporary `data-explorer-id` selectors.
- Captures `before.png` and `after.png` in `backend/artifacts/`.
- Records browser console events and HTTP responses with status codes of 400 or higher.
- Runs a fixed journey: fills the first visible input with `Hackathon Test Todo`, submits it, then attempts to toggle a matching interactive element.
- Emits an `ExplorerSnapshot`; browser/navigation errors are recorded in its execution metadata rather than re-raised.

### Source Mapper (`backend/core/source_mapper.py`)

- Scans `target-app/src` for `.ts` and `.tsx` files using Tree-sitter TSX parsing.
- Derives the most recent clicked element label/type from the Explorer journey.
- Matches JSX snippets containing that label and assigns heuristic confidence based on text and element-type matches.
- Returns candidate file, component, node, line, snippet, and confidence data in a `SourceSnapshot`.

### Analyzer (`backend/agents/analyzer.py`)

- Sends serialized Explorer and Source snapshots to `AsyncOpenAI.beta.chat.completions.parse`.
- Uses `OPENAI_MODEL`, defaulting to `gpt-4o-2024-08-06`.
- Requires an `AnalysisSnapshot` structured response.

### Repair (`backend/agents/repair.py`)

- Sends the analysis conclusion, repair objectives, and required context snippets to the same structured-output API.
- Requires a `RepairSnapshot` containing a list of exact-match `DiffBlock` search/replace operations.
- Applies each search block only when it occurs exactly once in the target file.
- Runs `npx tsc --noEmit` from the target file’s project directory after applying the patch. A failing compiler result triggers rollback; an exception launching the check is logged and treated as a pass.
- On syntax-validation failure, attempts GitPython rollback and falls back to restoring the in-memory original file contents.

### Verifier (`backend/agents/verifier.py`)

- Launches headless Chromium, navigates to the Explorer target URL, and executes the Repair snapshot’s `verification_steps`.
- Supports `click`, `type`, `assert_text`, `assert_visible`, and `assert_not_visible` actions.
- Captures `verify_after.png` and compares newly observed **console errors** with the Explorer’s baseline console errors. Network failures are recorded in `observed_results` but do not affect the pass/fail decision.
- Defaults to `rollback_required = true`; it becomes false only when every action succeeds and no new console errors are found.

### Orchestrator (`backend/orchestrator.py`)

- Builds `PipelineExecutionSnapshot` events, trace strings, stage durations, overall status, and final result.
- Finalizes Explorer, Analyzer, or Repair-stage failures as `Failed` where handled; uncaught exceptions finalize as `Error`.
- On verifier-requested rollback, attempts `git checkout -- <target_file>` through GitPython.

## 4. Repository Overview

- **`backend/`**: Python pipeline, FastAPI entry point, SQLite schema initialization, and generated artifacts. `backend/venv/` is a local ignored virtual environment.
- **`frontend/`**: Vite/React starter scaffold with Tailwind configuration and dashboard-oriented dependencies (`@tanstack/react-query`, `lucide-react`, and `reactflow`); no dashboard implementation exists yet.
- **`target-app/`**: Vite/React Todo test target. Its current intentional defects include stale-state updates, incomplete input validation, index keys, a missing Clear completed handler, and an inaccessible clickable toggle control. The Delete todo button is wired to `onDelete`.
- **`docs/`**: Architecture notes and handoff material. The repository inventory is located at `docs/handoffs/repository_inventory.md`.

## 5. Technology in Use

- **Backend runtime**: Python, FastAPI, Uvicorn, Pydantic, Playwright, Tree-sitter/Tree-sitter TypeScript, OpenAI Python SDK, structlog, GitPython, and SQLite.
- **Frontend/target runtime**: React, TypeScript, Vite, Tailwind CSS, Lucide React, and Oxlint. The dashboard scaffold additionally declares TanStack React Query and React Flow.
- **LLM integration**: OpenAI structured parsing through `beta.chat.completions.parse` with Pydantic response models.

## 6. Data Contracts

All contracts are defined in `backend/core/schemas.py`.

- **`ExplorerSnapshot`**: `page_url`, `page_summary`, `discovered_elements`, `detected_journey`, `runtime_evidence`, `console_events`, `network_failures`, `screenshots`, and `execution_metadata`.
- **`SourceSnapshot`**: `target_observation` and `candidate_files` with candidate components/nodes and heuristic confidence.
- **`AnalysisSnapshot`**: observed behavior, evidence, evidence graph, competing hypotheses, conclusion, repair context, unknowns, and assumptions.
- **`RepairSnapshot`**: target file, explanation, modified symbols, a **list** of `DiffBlock` values, confidence/risks, and a verification handoff.
- **`VerificationSnapshot`**: status, executed steps, observed results, regressions, before/after screenshot paths, reason, and rollback flag.
- **`PipelineExecutionSnapshot`**: optional snapshots for every stage plus metrics, execution history, events, status, total duration, and final result.

## 7. Current Progress

| Component | Current state | Remaining work |
| :--- | :--- | :--- |
| Schemas and Source Mapper | Implemented; both files have local modifications | Preserve the contract during future work |
| Explorer | Implemented and tracked | Runtime validation requires the target app and Playwright browser |
| Analyzer, Repair, Verifier, Orchestrator | Implemented but currently untracked | Add to version control when the owner is ready |
| FastAPI server and database | Server starts database initialization; API routes are mock responses; database is unused by agents/routes | Implement the orchestrator bridge |
| Dashboard | Vite starter scaffold only | Build the Phase 7 timeline, graph, diff, and polling UI |

## 8. Frozen Architecture Rules

1. Keep Pydantic snapshots as the agent handoff boundary.
2. Keep orchestration control flow in `Orchestrator`.
3. Keep the Verifier LLM-free.
4. Keep code modification to exact-match search/replace blocks.
5. Preserve the existing rollback behavior for syntax and verification failures.
6. Do not send the complete repository to the LLM.

## 9. Next Implementation Scope

1. Replace the mock FastAPI workflow routes with an orchestrator bridge.
2. Build the dashboard in `frontend/` to render `PipelineExecutionSnapshot.events` and related snapshot data.

The current frontend Vite configuration does not set a port; it uses Vite’s default port unless started with an override. The target app also uses Vite’s default configuration, so concurrent local startup requires selecting distinct ports.
