/**
 * FrontendPilot AI — typed API client.
 *
 * Centralizes all backend communication. Components should never
 * call fetch() directly.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

// ---------------------------------------------------------------------------
// Response types — mirrors backend Pydantic models
// ---------------------------------------------------------------------------

export interface OrchestrationEvent {
  stage: string
  status: string
  timestamp: string
}

export interface StartResponse {
  run_id: string
  status: string
}

export interface PipelineSnapshot {
  explorer_snapshot: Record<string, unknown> | null
  source_snapshot: Record<string, unknown> | null
  analysis_snapshot: Record<string, unknown> | null
  repair_snapshot: Record<string, unknown> | null
  verification_snapshot: Record<string, unknown> | null
  stage_metrics: Record<string, number>
  execution_history: string[]
  events: OrchestrationEvent[]
  overall_status: 'Success' | 'Failed' | 'Error'
  total_runtime_seconds: number
  final_result: string
}

export interface RunStatusResponse {
  run_id: string
  status: string
  created_at: string
  updated_at: string
  error: string | null
  snapshot: PipelineSnapshot | null
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function startPipeline(targetUrl?: string): Promise<StartResponse> {
  const res = await fetch(`${API_BASE}/workflow/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_url: targetUrl ?? null }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to start pipeline: ${res.status} ${text}`)
  }
  return res.json()
}

export async function getPipelineRun(runId: string): Promise<RunStatusResponse> {
  const res = await fetch(`${API_BASE}/workflow/${encodeURIComponent(runId)}`)
  if (res.status === 404) {
    throw new Error(`Run '${runId}' not found.`)
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to fetch run: ${res.status} ${text}`)
  }
  return res.json()
}

export function artifactUrl(filename: string): string {
  return `${API_BASE}/artifacts/${encodeURIComponent(filename)}`
}
