import { useState, useEffect } from 'react'
import { ChevronRight, Clock3, ExternalLink, FileWarning, Radio, AlertTriangle, Loader2 } from 'lucide-react'
import { AppShell } from '../../components/chrome/AppShell'
import { StageRail } from '../../components/chrome/StageRail'
import { StatusBadge } from '../../components/data-display/StatusBadge'
import { usePipelineRun } from '../../hooks/usePipelineRun'
import type { PipelineStage, StageStatus } from '../../types/pipeline'
import { stageColors } from '../../types/pipeline'
import type { PipelineSnapshot } from '../../api/pipeline'
import { ExplorerVisualizer, SourceMapperVisualizer, AnalyzerVisualizer, RepairVisualizer, VerifierVisualizer } from '../../components/run/StageVisualizers'

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

  let firstMissing = -1
  const stages: PipelineStage[] = STAGE_DEFS.map((def, i) => {
    const hasSnapshot = snap[def.snapshotKey as keyof PipelineSnapshot] != null
    const duration = snap.stage_metrics[def.metricKey]

    let status: StageStatus
    if (hasSnapshot) {
      status = 'complete'
    } else if (firstMissing === -1) {
      firstMissing = i
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
// Mobile pipeline
// ---------------------------------------------------------------------------

function MobilePipeline({ stages, selectedStageId, onSelectStage }: { stages: PipelineStage[]; selectedStageId: string; onSelectStage: (id: string) => void }) {
  return (
    <nav className="mobile-pipeline" aria-label="Pipeline stages" style={{ padding: '8px', gap: '8px' }}>
      {stages.map((stage, index) => {
        const isSelected = stage.id === selectedStageId
        const activeColor = stageColors[stage.id]
        return (
          <div 
            className={`mobile-stage mobile-stage-${stage.status}`} 
            key={stage.id}
            onClick={() => onSelectStage(stage.id)}
            style={{
              cursor: 'pointer',
              border: isSelected ? `1px solid ${activeColor}` : '1px solid var(--border)',
              background: isSelected ? `${activeColor}15` : 'transparent',
              padding: '6px 8px',
              borderRadius: '6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minWidth: 0
            }}
          >
            <span style={{ fontSize: '9px', color: isSelected ? activeColor : 'var(--text-muted)' }}>0{index + 1}</span>
            <strong style={{ fontSize: '10px', color: isSelected ? 'var(--text)' : 'var(--text-secondary)' }}>{stage.name}</strong>
          </div>
        )
      })}
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
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)

  const stages = deriveStages(data?.snapshot ?? null, data?.status ?? 'Running')
  
  // Auto-focus on active stage when running or last completed/failed stage
  const activeStage = stages.find(s => s.status === 'running') ?? stages.find(s => s.status === 'failed') ?? stages[stages.length - 1]
  const currentStageId = selectedStageId || activeStage.id
  const displayedStage = stages.find(s => s.id === currentStageId) || activeStage

  // Sync selected stage if running stage changes and user has not interacted
  useEffect(() => {
    if (!selectedStageId) {
      setSelectedStageId(activeStage.id)
    }
  }, [activeStage.id, selectedStageId])

  const runStatus = data?.status ?? 'Running'
  const mappedBadgeStatus = runStatus === 'Running' ? 'Running' as const
    : runStatus === 'Success' ? 'Success' as const
    : runStatus === 'Failed' ? 'Failed' as const
    : 'Error' as const

  const elapsed = data?.snapshot?.total_runtime_seconds != null
    ? `${data.snapshot.total_runtime_seconds.toFixed(1)}s`
    : '—'

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
        <StageRail 
          stages={stages} 
          selectedStageId={currentStageId}
          onSelectStage={setSelectedStageId}
        />
        
        <section className="workspace" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Breadcrumb / Top Bar details */}
          <div className="run-breadcrumb" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Runs</span>
              <ChevronRight size={12} />
              <strong>{runId}</strong>
              <span className="demo-chip" style={{ border: '1px solid rgba(139,140,255,.2)', color: 'var(--signal-bright)', background: 'var(--signal-soft)' }}>
                Live Execution
              </span>
            </div>
            
            <div className="run-status-cluster" style={{ gap: '16px' }}>
              <StatusBadge status={mappedBadgeStatus} />
              <span style={{ color: 'var(--text-secondary)' }}><Clock3 size={13} style={{ marginRight: '4px', inlineSize: 'auto' }} /> Duration: {elapsed}</span>
            </div>
          </div>

          {/* PRIORITY 3: LARGE MISSION CONTROL HERO HEADER */}
          <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
            <span className="eyebrow" style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '6px' }}>
              AUTONOMOUS AGENT INVESTIGATION
            </span>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px 0', lineHeight: 1.15 }}>
              {data?.snapshot?.final_result && runStatus !== 'Running' 
                ? data.snapshot.final_result 
                : 'AI Agent is actively searching workspace...'}
            </h1>
            
            {/* Target App Server info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Target App: <strong style={{ color: 'var(--text)' }}>Todo App</strong></span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ExternalLink size={12} /> URL: <code>http://localhost:5173</code>
              </span>
            </div>
          </header>

          {/* Mobile responsive progress rail */}
          <MobilePipeline 
            stages={stages} 
            selectedStageId={currentStageId}
            onSelectStage={setSelectedStageId}
          />

          {/* Primary Split View: Visual Evidence Focus on the Left, Context Metrics & Event Log on Right */}
          <section className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.6fr)', gap: '20px' }}>
            
            {/* Focal Evidence Area */}
            <article className="focus-panel" style={{ padding: '24px', minHeight: '420px', border: `1px solid ${stageColors[displayedStage.id]}33` }}>
              <div className="panel-heading" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow" style={{ color: stageColors[displayedStage.id] }}>
                    <Radio size={13} className={displayedStage.status === 'running' ? 'pulsing-icon' : ''} /> 
                    {displayedStage.status === 'running' ? 'CURRENT PIPELINE STAGE' : 'STAGE SNAPSHOT EVIDENCE'}
                  </p>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>{displayedStage.name}</h2>
                </div>
                <StatusBadge status={displayedStage.status} />
              </div>

              {/* Progressive Data Canvas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {displayedStage.id === 'explorer' && (
                  <ExplorerVisualizer data={data?.snapshot?.explorer_snapshot} />
                )}
                {displayedStage.id === 'mapper' && (
                  <SourceMapperVisualizer data={data?.snapshot?.source_snapshot} />
                )}
                {displayedStage.id === 'analyzer' && (
                  <AnalyzerVisualizer data={data?.snapshot?.analysis_snapshot} />
                )}
                {displayedStage.id === 'repair' && (
                  <RepairVisualizer data={data?.snapshot?.repair_snapshot} />
                )}
                {displayedStage.id === 'verifier' && (
                  <VerifierVisualizer data={data?.snapshot?.verification_snapshot} />
                )}
              </div>
            </article>

            {/* Metrics & Logs Column */}
            <aside className="side-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Timeline Metrics */}
              <article className="panel-card" style={{ padding: '16px' }}>
                <span className="eyebrow" style={{ marginBottom: '10px' }}>PIPELINE SPEED</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {stages.map(st => {
                    const isActive = st.id === currentStageId
                    const color = stageColors[st.id]
                    return (
                      <div 
                        key={st.id}
                        onClick={() => setSelectedStageId(st.id)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          fontSize: '12px',
                          cursor: 'pointer',
                          background: isActive ? `${color}11` : 'transparent',
                          border: isActive ? `1px solid ${color}33` : '1px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ color: isActive ? 'var(--text)' : 'var(--text-secondary)', fontWeight: isActive ? 700 : 500 }}>{st.name}</span>
                        <code style={{ color: st.duration !== '—' ? color : 'var(--text-muted)' }}>{st.duration}</code>
                      </div>
                    )
                  })}
                </div>
              </article>

              {/* Event Logs Trace */}
              <article className="panel-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="panel-heading" style={{ marginBottom: '12px' }}>
                  <div>
                    <p className="eyebrow">AGENT ACTIVITY TRACE</p>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0 0 0' }}>Workspace Log</h3>
                  </div>
                  <FileWarning size={15} style={{ color: 'var(--text-muted)' }} />
                </div>
                
                <ol className="event-list" style={{ margin: 0, overflowY: 'auto', maxHeight: '240px', flex: 1 }}>
                  {(data?.snapshot?.execution_history ?? []).map((entry, i) => (
                    <li key={i} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                      <span className={`event-dot ${entry.toLowerCase().includes('completed') ? 'complete' : entry.toLowerCase().includes('started') ? 'running' : entry.toLowerCase().includes('failed') || entry.toLowerCase().includes('skipped') ? 'failed' : 'queued'}`} />
                      <span style={{ flex: 1, color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{entry}</span>
                      <time style={{ fontSize: '9px', color: 'var(--text-muted)' }}>0{i + 1}</time>
                    </li>
                  ))}
                  {(!data?.snapshot?.execution_history?.length) && (
                    <li style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span className="event-dot queued" />Waiting for pipeline initialization...
                    </li>
                  )}
                </ol>
              </article>

            </aside>
          </section>

        </section>
      </main>
    </AppShell>
  )
}
