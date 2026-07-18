import { ChevronRight, Clock3, ExternalLink, FileWarning, Radio, ScanSearch, AlertTriangle, Loader2 } from 'lucide-react'
import { AppShell } from '../../components/chrome/AppShell'
import { StageRail } from '../../components/chrome/StageRail'
import { StatusBadge } from '../../components/data-display/StatusBadge'
import { usePipelineRun } from '../../hooks/usePipelineRun'
import type { PipelineStage, StageStatus } from '../../types/pipeline'
import type { PipelineSnapshot } from '../../api/pipeline'

// ---------------------------------------------------------------------------
// Helpers — derive stage data from real PipelineExecutionSnapshot
// ---------------------------------------------------------------------------

const STAGE_DEFS = [
  { id: 'explorer' as const, name: 'Explorer', snapshotKey: 'explorer_snapshot', metricKey: 'Explorer', snapshot: 'ExplorerSnapshot' },
  { id: 'mapper' as const, name: 'Source Mapper', snapshotKey: 'source_snapshot', metricKey: 'Source Mapper', snapshot: 'SourceSnapshot' },
  { id: 'analyzer' as const, name: 'Analyzer', snapshotKey: 'analysis_snapshot', metricKey: 'Analyzer', snapshot: 'AnalysisSnapshot' },
  { id: 'repair' as const, name: 'Repair', snapshotKey: 'repair_snapshot', metricKey: 'Repair', snapshot: 'RepairSnapshot' },
  { id: 'verifier' as const, name: 'Verifier', snapshotKey: 'verification_snapshot', metricKey: 'Verifier', snapshot: 'VerificationSnapshot' },
] as const

function deriveStages(snap: PipelineSnapshot | null, runStatus: string): PipelineStage[] {
  if (!snap) {
    return STAGE_DEFS.map(def => ({
      id: def.id,
      name: def.name,
      snapshot: def.snapshot,
      status: 'queued' as StageStatus,
      duration: '—',
      progress: 'Waiting',
      summary: '',
      insight: '',
      facts: [],
    }))
  }

  // Determine which snapshots are populated
  let firstMissing = -1
  const stages: PipelineStage[] = STAGE_DEFS.map((def, i) => {
    const hasSnapshot = snap[def.snapshotKey as keyof PipelineSnapshot] != null
    const duration = snap.stage_metrics[def.metricKey]

    let status: StageStatus
    if (hasSnapshot) {
      status = 'complete'
    } else if (firstMissing === -1) {
      firstMissing = i
      // Check if this stage failed
      const failedEvent = snap.events.find(e => e.stage === def.metricKey && e.status === 'failed')
      const skippedEvent = snap.events.find(e => e.stage === def.metricKey && e.status === 'skipped')
      if (failedEvent) {
        status = 'failed'
      } else if (skippedEvent) {
        status = 'queued'
      } else if (runStatus === 'Running') {
        status = 'running'
      } else {
        status = 'queued'
      }
    } else {
      const skippedEvent = snap.events.find(e => e.stage === def.metricKey && e.status === 'skipped')
      const failedEvent = snap.events.find(e => e.stage === def.metricKey && e.status === 'failed')
      if (failedEvent) status = 'failed'
      else if (skippedEvent) status = 'queued'
      else status = 'queued'
    }

    const progress = status === 'complete' ? 'Complete'
      : status === 'running' ? 'In progress'
      : status === 'failed' ? 'Failed'
      : 'Waiting'

    return {
      id: def.id,
      name: def.name,
      snapshot: def.snapshot,
      status,
      duration: duration != null ? `${duration}s` : '—',
      progress,
      summary: extractSummary(def.id, snap),
      insight: extractInsight(def.id, snap),
      facts: extractFacts(def.id, snap),
    }
  })

  return stages
}

function extractSummary(stageId: string, snap: PipelineSnapshot): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = snap as any
  if (stageId === 'explorer' && s.explorer_snapshot) {
    const es = s.explorer_snapshot
    const meta = es.execution_metadata
    return meta?.success ? 'Runtime evidence captured successfully.' : 'Explorer encountered an error.'
  }
  if (stageId === 'mapper' && s.source_snapshot) {
    const ss = s.source_snapshot
    const files = ss.candidate_files as unknown[]
    return `Mapped ${files?.length ?? 0} candidate file(s) using Tree-sitter AST.`
  }
  if (stageId === 'analyzer' && s.analysis_snapshot) {
    const as_ = s.analysis_snapshot
    const conclusion = as_.conclusion
    return conclusion?.root_cause as string ?? 'Analysis complete.'
  }
  if (stageId === 'repair' && s.repair_snapshot) {
    const rs = s.repair_snapshot
    return rs.patch_explanation as string ?? 'Patch generated.'
  }
  if (stageId === 'verifier' && s.verification_snapshot) {
    const vs = s.verification_snapshot as Record<string, unknown>
    return vs.pass_fail_reason as string ?? 'Verification complete.'
  }
  return ''
}

function extractInsight(stageId: string, snap: PipelineSnapshot): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = snap as any
  if (stageId === 'explorer' && s.explorer_snapshot) {
    const es = s.explorer_snapshot
    const re = es.runtime_evidence
    return re?.observed_dom_change as string ?? ''
  }
  if (stageId === 'analyzer' && s.analysis_snapshot) {
    const as_ = s.analysis_snapshot
    const conclusion = as_.conclusion as Record<string, unknown> | undefined
    return `Confidence: ${conclusion?.investigation_confidence ?? 'Unknown'}`
  }
  if (stageId === 'repair' && s.repair_snapshot) {
    const rs = s.repair_snapshot
    return `Confidence: ${rs.repair_confidence ?? 'Unknown'} · ${(rs.modified_symbols as string[])?.join(', ') ?? ''}`
  }
  if (stageId === 'verifier' && s.verification_snapshot) {
    const vs = s.verification_snapshot
    return `Status: ${vs.verification_status ?? 'Unknown'} · Rollback: ${vs.rollback_required ? 'Yes' : 'No'}`
  }
  return ''
}

function extractFacts(stageId: string, snap: PipelineSnapshot): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = snap as any
  if (stageId === 'explorer' && s.explorer_snapshot) {
    const es = s.explorer_snapshot
    const ps = es.page_summary
    const consoleEvts = es.console_events as unknown[] | undefined
    const netFails = es.network_failures as unknown[] | undefined
    return [
      `${ps?.total_interactive_elements ?? 0} interactive elements discovered`,
      `${consoleEvts?.length ?? 0} console events`,
      `${netFails?.length ?? 0} network failures`,
    ]
  }
  if (stageId === 'mapper' && s.source_snapshot) {
    const ss = s.source_snapshot
    const files = ss.candidate_files as Record<string, unknown>[] | undefined
    return (files ?? []).slice(0, 3).map((f: any) => `${f.file_path} (${(f.components as unknown[])?.length ?? 0} components)`)
  }
  if (stageId === 'analyzer' && s.analysis_snapshot) {
    const as_ = s.analysis_snapshot
    const hyps = as_.competing_hypotheses as any[] | undefined
    return (hyps ?? []).map((h: any) => `${h.hypothesis} [${h.plausibility_score}]`)
  }
  if (stageId === 'repair' && s.repair_snapshot) {
    const rs = s.repair_snapshot
    return [
      `Target: ${rs.target_file ?? 'Unknown'}`,
      `Diffs: ${(rs.diff as unknown[])?.length ?? 0} block(s)`,
      ...(rs.repair_risks as string[] ?? []).slice(0, 2),
    ]
  }
  if (stageId === 'verifier' && s.verification_snapshot) {
    const vs = s.verification_snapshot as Record<string, unknown>
    const regs = vs.regressions_detected as string[] | undefined
    return [
      `Steps executed: ${(vs.executed_steps as unknown[])?.length ?? 0}`,
      ...(regs ?? []).slice(0, 2),
    ]
  }
  return []
}

// ---------------------------------------------------------------------------
// Mobile pipeline (reused from RunDashboardPage)
// ---------------------------------------------------------------------------

function MobilePipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <nav className="mobile-pipeline" aria-label="Pipeline stages">
      {stages.map((stage, index) => (
        <div className={`mobile-stage mobile-stage-${stage.status}`} key={stage.id}>
          <span>{index + 1}</span><strong>{stage.name}</strong>
        </div>
      ))}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  runId: string
}

export function LiveRunDashboardPage({ runId }: Props) {
  const { data, error, loading } = usePipelineRun(runId)

  const stages = deriveStages(data?.snapshot ?? null, data?.status ?? 'Running')
  const activeStage = stages.find(s => s.status === 'running') ?? stages.find(s => s.status === 'failed') ?? stages[stages.length - 1]

  const runStatus = data?.status ?? 'Running'
  const mappedBadgeStatus = runStatus === 'Running' ? 'Running' as const
    : runStatus === 'Success' ? 'Success' as const
    : runStatus === 'Failed' ? 'Failed' as const
    : 'Error' as const

  const elapsed = data?.snapshot?.total_runtime_seconds != null
    ? `${data.snapshot.total_runtime_seconds.toFixed(1)}s`
    : '—'

  // Loading state
  if (loading && !data) {
    return (
      <AppShell showBack>
        <main className="dashboard-page" style={{ display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="pulsing-icon" />
            <p style={{ marginTop: '12px' }}>Connecting to pipeline…</p>
          </div>
        </main>
      </AppShell>
    )
  }

  // Error state — backend unreachable or run not found
  if (error && !data) {
    return (
      <AppShell showBack>
        <main className="dashboard-page" style={{ display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <AlertTriangle size={32} style={{ color: 'var(--danger)' }} />
            <h2 style={{ margin: '12px 0 8px', fontSize: '20px' }}>Connection failed</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6' }}>{error}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '16px' }}>
              Verify the backend is running at <code>localhost:8000</code>
            </p>
          </div>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell showBack>
      <main className="dashboard-page">
        <StageRail stages={stages} />
        <section className="workspace">
          <div className="run-breadcrumb">
            <span>Runs</span><ChevronRight size={14} /><strong>{runId}</strong>
            <span className="demo-chip" style={runStatus === 'Running' ? { borderColor: 'rgba(139,140,255,.32)', color: 'var(--signal-bright)', background: 'var(--signal-soft)' } : runStatus === 'Success' ? { borderColor: 'rgba(110,231,183,.32)', color: 'var(--success)', background: 'rgba(110,231,183,.08)' } : { borderColor: 'rgba(251,113,133,.32)', color: 'var(--danger)', background: 'rgba(251,113,133,.08)' }}>
              Live run
            </span>
          </div>
          <header className="run-header">
            <div>
              <p className="eyebrow">Autonomous investigation · Target App</p>
              <h1>{data?.snapshot?.final_result && runStatus !== 'Running' ? data.snapshot.final_result : 'Pipeline executing…'}</h1>
              <p className="run-target"><ExternalLink size={14} /> localhost:5173</p>
            </div>
            <div className="run-status-cluster">
              <StatusBadge status={mappedBadgeStatus} />
              <span><Clock3 size={14} /> {elapsed}</span>
            </div>
          </header>

          <section className="run-context-grid" aria-label="Run context">
            <div><span>Target</span><strong>Todo App</strong></div>
            <div className="context-issue"><span>Pipeline result</span><strong>{data?.snapshot?.final_result ?? 'In progress'}</strong></div>
            <div><span>Current stage</span><strong>{activeStage.name}</strong></div>
          </section>

          <MobilePipeline stages={stages} />

          <section className="dashboard-content">
            <article className="focus-panel">
              <div className="panel-heading">
                <div><p className="eyebrow"><Radio size={13} className={runStatus === 'Running' ? 'pulsing-icon' : ''} /> {runStatus === 'Running' ? 'Active investigation stage' : 'Investigation result'}</p><h2>{activeStage.name}</h2></div>
                <StatusBadge status={activeStage.status} />
              </div>
              <p className="focus-summary">{activeStage.summary || 'Waiting for stage data…'}</p>
              
              {activeStage.facts.length > 0 && (
                <div className="investigation-canvas">
                  <div className="canvas-root-cause">
                    <ScanSearch size={20} />
                    <span>Evidence convergence</span>
                    <strong>{activeStage.insight || '—'}</strong>
                  </div>
                  <ol className="hypothesis-list">
                    {activeStage.facts.map((fact, index) => (
                      <li className={index === 0 ? 'favored-hypothesis' : ''} key={fact}>
                        <span>{index + 1}</span>{fact}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </article>
            
            <aside className="side-stack">
              <article className="panel-card">
                <div className="panel-heading"><div><p className="eyebrow">Execution trace</p><h3>Pipeline event log</h3></div><FileWarning size={18} /></div>
                <ol className="event-list">
                  {(data?.snapshot?.execution_history ?? []).map((entry, i) => (
                    <li key={i}>
                      <span className={`event-dot ${entry.toLowerCase().includes('completed') ? 'complete' : entry.toLowerCase().includes('started') ? 'running' : entry.toLowerCase().includes('failed') || entry.toLowerCase().includes('skipped') ? 'failed' : 'queued'}`} />
                      {entry} <time>0{i + 1}</time>
                    </li>
                  ))}
                  {(!data?.snapshot?.execution_history?.length) && (
                    <li><span className="event-dot queued" />Waiting for pipeline events…</li>
                  )}
                </ol>
              </article>
              <article className="panel-card contract-card">
                <p className="eyebrow">Stage metrics</p>
                {Object.entries(data?.snapshot?.stage_metrics ?? {}).map(([stage, duration]) => (
                  <div key={stage} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>{stage}</span>
                    <code style={{ color: 'var(--signal-bright)' }}>{duration}s</code>
                  </div>
                ))}
                {!Object.keys(data?.snapshot?.stage_metrics ?? {}).length && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>No metrics yet.</p>
                )}
              </article>
            </aside>
          </section>

        </section>
      </main>
    </AppShell>
  )
}
