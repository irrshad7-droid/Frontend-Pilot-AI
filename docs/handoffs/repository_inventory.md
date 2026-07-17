# FrontendPilot AI — Repository Inventory

**Synchronization basis**: Current working tree, 2026-07-17. This inventory describes the implementation and working-tree state; it does not imply that untracked modules have been committed.

## 1. Repository Tree

```text
.
├── backend
│   ├── agents
│   │   ├── analyzer.py            # Structured-output LLM analysis (untracked)
│   │   ├── explorer.py            # Playwright discovery journey (tracked)
│   │   ├── repair.py              # Structured-output patch generation/application (untracked)
│   │   └── verifier.py            # Deterministic Playwright verification (untracked)
│   ├── api/routes.py              # Mock FastAPI workflow routes
│   ├── artifacts/                 # Ignored screenshots, mock data, and pipeline trace
│   ├── core
│   │   ├── schemas.py             # Pydantic contracts (modified)
│   │   └── source_mapper.py       # Tree-sitter JSX mapper (modified)
│   ├── database.py                # SQLite initialization and connection context
│   ├── main.py                    # FastAPI entry point
│   ├── orchestrator.py            # Sequential pipeline coordinator (untracked)
│   └── venv/                      # Ignored local Python virtual environment
├── docs/                          # Untracked architecture and handoff docs
│   ├── architecture/implementation_plan.md
│   ├── handoffs/{repository_inventory.md,task.md,walkthrough.md}
│   ├── ENGINEERING_HANDOFF.md
│   └── README.md
├── frontend/                      # Vite/React starter scaffold; dashboard not implemented
│   ├── public/{favicon.svg,icons.svg}
│   ├── src/{assets/,App.tsx,index.css,main.tsx}
│   ├── {index.html,package.json,postcss.config.js,tailwind.config.js,vite.config.ts}
│   └── TypeScript/Oxlint configuration and package lock
└── target-app/                    # Vite/React Todo target application
    ├── public/{favicon.svg,icons.svg}
    ├── src/{api/mockApi.ts,components/TodoItem.tsx,App.tsx,index.css,main.tsx,types.ts}
    └── Vite, Tailwind, TypeScript, Oxlint configuration and package lock
```

## 2. Backend Inventory

| File | Implementation | Public functions/classes | Current state |
| :--- | :--- | :--- | :--- |
| `backend/main.py` | FastAPI application, permissive CORS, `/api` router, startup database initialization | `app`, `startup_event()` | Server scaffold; routes remain mock |
| `backend/database.py` | SQLite `pilot.db` schema and transactional connection context | `init_db()`, `get_db()` | Implemented; unused by agents/routes |
| `backend/api/routes.py` | Static mock workflow, status, issues, repair, and trace responses | `StartRequest`, `start_workflow()`, `get_status()`, `get_issues()`, `start_repair()`, `get_trace()` | Mock |
| `backend/core/schemas.py` | Pydantic stage contracts | Snapshot and supporting model classes | Implemented; modified |
| `backend/core/source_mapper.py` | Tree-sitter TSX/TS search by Explorer-derived label/type | `SourceMapper.run()`, `SourceMapper.find_candidates()` | Implemented; modified |
| `backend/agents/explorer.py` | Fixed Playwright discovery/add/toggle journey | `run_explorer()` | Implemented; tracked |
| `backend/agents/analyzer.py` | OpenAI structured analysis | `analyze_failure()` | Implemented; untracked |
| `backend/agents/repair.py` | OpenAI structured repair, exact-match apply, syntax check, rollback | `validate_syntax()`, `apply_patch_with_rollback()`, `generate_repair()`, `execute_repair_pipeline()`; `PatchValidationError`, `SyntaxValidationError` | Implemented; untracked |
| `backend/agents/verifier.py` | Playwright action execution and console-error comparison | `execute_action()`, `verify_repair()` | Implemented; untracked |
| `backend/orchestrator.py` | Sequential pipeline coordinator and verifier rollback | `Orchestrator`, `Orchestrator.run_pipeline()` | Implemented; untracked |

## 3. Frontend and Target Application

### `frontend/`

- Uses React 19, TypeScript, Vite, Tailwind CSS, Lucide React, TanStack React Query, and React Flow.
- `src/App.tsx` is the unmodified Vite starter/count screen, not a dashboard.
- `src/index.css` imports Tailwind layers and sets full-height root sizing.
- `vite.config.ts` has no explicit server port.

### `target-app/`

- Uses React 19, TypeScript, Vite, Tailwind CSS, Lucide React, and Oxlint.
- `App.tsx` contains Todo state, asynchronous `mockApi` calls, Add, Toggle, and Delete handlers.
- `TodoItem.tsx` renders a clickable completion `div` and a functional Delete button.
- Intentional defect comments identify: input validation that continues after error, stale-state Add and Toggle updates, index keys, an unwired Clear completed button, and missing accessibility semantics on the clickable completion control.

## 4. Schemas

All models are located in `backend/core/schemas.py`.

| Snapshot | Fields |
| :--- | :--- |
| `ExplorerSnapshot` | `page_url`, `page_summary`, `discovered_elements`, `detected_journey`, `runtime_evidence`, `console_events`, `network_failures`, `screenshots`, `execution_metadata` |
| `SourceSnapshot` | `target_observation`, `candidate_files` |
| `AnalysisSnapshot` | `observed_behavior`, `evidence_evaluated`, `evidence_graph`, `competing_hypotheses`, `conclusion`, `repair_context`, `unknowns`, `assumptions` |
| `RepairSnapshot` | `target_file`, `patch_explanation`, `modified_symbols`, `diff: List[DiffBlock]`, `repair_confidence`, `repair_risks`, `verification_handoff` |
| `VerificationSnapshot` | `verification_status`, `executed_steps`, `observed_results`, `regressions_detected`, `screenshot_before`, `screenshot_after`, `pass_fail_reason`, `rollback_required` |
| `PipelineExecutionSnapshot` | optional stage snapshots, `stage_metrics`, `execution_history`, `events`, `overall_status`, `total_runtime_seconds`, `final_result` |

## 5. API

`backend/api/routes.py` is a mock implementation registered below `/api` by `backend/main.py`.

| Method and route | Current response |
| :--- | :--- |
| `POST /api/workflow/start` | `{"status": "started", "run_id": "test_run_123"}`; accepts `journey_name` |
| `GET /api/workflow/status` | `{"active_agent": "explorer", "progress": 10}` |
| `GET /api/issues` | `[]` |
| `POST /api/repair/{issue_id}` | `{"status": "repair_started"}` |
| `GET /api/traces/{step_id}` | `{"html": "<html><body>Trace preview</body></html>"}` |

## 6. Database

`backend/database.py` creates `backend/pilot.db` when initialized. It defines:

- `runs`: `id`, `status`, `created_at`
- `issues`: `id`, `run_id`, `title`, `component_path`, `dom_snapshot_url`, `confidence_score`, `explanation`, `evidence`, `status`
- `patches`: `id`, `issue_id`, `diff_content`, `confidence_score`, `explanation`, `evidence`, `verification_status`

The API startup hook initializes this schema. No route or pipeline stage currently reads or writes these tables.

## 7. Environment Variables

| Variable | Default | Used in |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | Unset; standalone scripts set a dummy key if absent | Analyzer and Repair |
| `OPENAI_MODEL` | `gpt-4o-2024-08-06` | Analyzer and Repair |
| `TARGET_APP_URL` | `http://localhost:5173` | Explorer |

## 8. Runtime Dependencies

- **Python imports**: FastAPI, Uvicorn, Pydantic, Playwright, Tree-sitter, Tree-sitter TypeScript, OpenAI, structlog, GitPython, and SQLite (stdlib).
- **Frontend package dependencies**: React, React DOM, TanStack React Query, Lucide React, and React Flow; Vite, TypeScript, Tailwind, PostCSS, Autoprefixer, and Oxlint are development dependencies.
- **Target-app package dependencies**: React, React DOM, and Lucide React; Vite, TypeScript, Tailwind, PostCSS, Autoprefixer, and Oxlint are development dependencies.

## 9. Commands

- Run target application: `cd target-app && npm run dev`
- Run dashboard scaffold: `cd frontend && npm run dev`
- Run standalone pipeline: `cd backend && python orchestrator.py`
- Type-check either Vite project: `cd frontend && npx tsc --noEmit` or `cd target-app && npx tsc --noEmit`
- Run FastAPI entry point: `cd backend && python main.py`

Both Vite projects use default configuration and therefore default to the same Vite port when started independently.

## 10. Working-Tree State

- **Branch**: `main`
- **Modified tracked files**: `backend/core/schemas.py`, `backend/core/source_mapper.py`
- **Untracked implementation files**: `backend/agents/analyzer.py`, `backend/agents/repair.py`, `backend/agents/verifier.py`, `backend/orchestrator.py`
- **Untracked documentation**: `docs/`
- **Tracked Explorer**: `backend/agents/explorer.py`
- **Ignored paths relevant to this project**: `backend/artifacts/`, `backend/*.db`, virtual environments, Node `node_modules/`, `dist/`, Python caches, `.env` files, and common editor/system files.

## 11. Known Implementation Boundaries

- FastAPI workflow endpoints do not call the orchestrator.
- The dashboard has not been implemented; its current screen is the Vite starter template.
- The Explorer journey is hard-coded to Add then Toggle Todo behavior.
- The Source Mapper matches JSX textual content/element type rather than a general DOM-to-source mapping.
- Repair only treats a nonzero `tsc` result as a syntax failure; inability to run the check fails open.
- Verifier pass/fail regression detection considers new console errors, not recorded network failures.
- The SQLite schema is initialized but unused by the API and pipeline.
