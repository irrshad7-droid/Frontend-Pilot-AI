# Implementation Tasks

## Phase 1: Foundation
- `[x]` Scaffold monorepo structure in `frontend-pilot-ai` directory
- `[x]` Setup Target App (Vite React App - Todo)
- `[x]` Seed realistic defects in Target App
- `[x]` Setup Backend (FastAPI, SQLite schema)
- `[x]` Setup Frontend (Vite React App, shadcn/ui, Tailwind)

## Phase 2: Observation & Understanding
- `[x]` Implement Explorer Agent (Playwright DOM discovery)
- `[x]` Implement Analyzer Agent (Tree-sitter mapping)
- `[x]` Implement Confidence Scoring for Analyzer
- `[ ]` Connect Explorer & Analyzer to FastAPI endpoints
- `[ ]` Ensure failures result in DB `issues`

## Phase 4: Repair
- `[x]` Define RepairSnapshot in schemas.py
- `[x]` Implement Repair Agent (repair.py)
- `[x]` Implement Patch Validator & Rollback mechanics
- `[x]` Test standalone Repair executions

## Phase 5: Verification
- `[x]` Update VerificationHandoff and VerificationSnapshot in schemas.py
- `[x]` Implement Verifier Agent (verifier.py)
- `[x]` Implement standalone execution for Verifier

## Phase 6: E2E Pipeline Orchestration
- `[ ]` Orchestrate full pipeline (Explorer -> Mapper -> Analyzer -> Repair -> Verifier)rifier to FastAPI endpoints

## Phase 3: Execution & Verification
- `[ ]` Implement Repair Agent (Codex + Confidence Scoring)
- `[ ]` Implement Verifier Agent (Playwright re-run, single retry loop)
- `[ ]` Implement Git patch generation
- `[ ]` Connect Repair & Verifier to FastAPI endpoints

## Phase 4: Polish & Demo
- `[ ]` Build Frontend Execution Timeline UI
- `[ ]` Build React Flow visualization (Secondary panel)
- `[ ]` Build Agent terminal UI and Diff viewer

