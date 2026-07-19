import { useState } from 'react'
import { BrainCircuit, CheckCircle2, Compass, AlertTriangle, Cpu, FileCode, FileSearch, ShieldCheck, Wrench, Terminal, Server, HelpCircle, Eye } from 'lucide-react'

// ---------------------------------------------------------------------------
// Shared visual helpers
// ---------------------------------------------------------------------------

function ConfidenceBadge({ level }: { level: 'High' | 'Medium' | 'Low' | string }) {
  const colors = {
    High: { border: 'rgba(16, 185, 129, 0.2)', text: '#10b981', bg: 'rgba(16, 185, 129, 0.06)' },
    Medium: { border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.06)' },
    Low: { border: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', bg: 'rgba(239, 68, 68, 0.06)' },
  }[level as 'High' | 'Medium' | 'Low'] || { border: 'var(--border)', text: 'var(--text-secondary)', bg: 'var(--surface-muted)' }

  return (
    <span 
      style={{
        padding: '3px 8px',
        borderRadius: '999px',
        border: `1px solid ${colors.border}`,
        color: colors.text,
        backgroundColor: colors.bg,
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
      {level} Confidence
    </span>
  )
}

function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: '#090a0f', margin: '8px 0' }}>
      {filename && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'monospace' }}>
          <FileCode size={13} />
          {filename}
        </div>
      )}
      <pre style={{ margin: 0, padding: '12px', overflowX: 'auto', fontSize: '12px', lineHeight: '1.5', color: '#e2e8f0', fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1. Explorer Visualizer
// ---------------------------------------------------------------------------

export function ExplorerVisualizer({ data }: { data: any }) {
  const [activeScreenshotTab, setActiveScreenshotTab] = useState<'before' | 'after'>('before')

  if (!data) return <EmptyState stage="Explorer" />

  const summary = data.page_summary || {}
  const evidence = data.runtime_evidence || {}
  const consoleEvents = data.console_events || []
  const networkFailures = data.network_failures || []
  const screenshots = data.screenshots || []

  const getFullUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('/') || path.startsWith('http')) {
      if (path.startsWith('/api')) {
        return `http://localhost:8000${path}`
      }
      return path
    }
    return `http://localhost:8000/api/artifacts/${path}`
  }

  // Find the selected screenshot
  const selectedScreenshot = screenshots.find((s: any) => s.name === activeScreenshotTab) || screenshots[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Target and Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className="panel-card" style={{ padding: '14px' }}>
          <span className="eyebrow" style={{ fontSize: '9px' }}>Page Title</span>
          <strong style={{ display: 'block', fontSize: '14px', marginTop: '4px', color: 'var(--text)' }}>{summary.title || 'Todo App'}</strong>
        </div>
        <div className="panel-card" style={{ padding: '14px' }}>
          <span className="eyebrow" style={{ fontSize: '9px' }}>Total Interactive Elements</span>
          <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px', color: '#06b6d4' }}>{summary.total_interactive_elements || 0}</strong>
        </div>
        <div className="panel-card" style={{ padding: '14px' }}>
          <span className="eyebrow" style={{ fontSize: '9px' }}>Buttons / Inputs</span>
          <strong style={{ display: 'block', fontSize: '14px', marginTop: '4px', color: 'var(--text-secondary)' }}>
            {summary.button_count || 0} Buttons · {summary.input_count || 0} Inputs
          </strong>
        </div>
      </div>

      {/* Target Screen Capture & Evidences */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Dynamic Screen Capture Frame */}
        <div className="panel-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="eyebrow" style={{ color: '#06b6d4' }}>TARGET STATE SCREENSHOT</span>
            
            {screenshots.length > 1 && (
              <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-muted)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setActiveScreenshotTab('before')}
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 0,
                    cursor: 'pointer',
                    background: activeScreenshotTab === 'before' ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: activeScreenshotTab === 'before' ? 'var(--text)' : 'var(--text-muted)'
                  }}
                >
                  BEFORE
                </button>
                <button 
                  onClick={() => setActiveScreenshotTab('after')}
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 0,
                    cursor: 'pointer',
                    background: activeScreenshotTab === 'after' ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: activeScreenshotTab === 'after' ? 'var(--text)' : 'var(--text-muted)'
                  }}
                >
                  AFTER
                </button>
              </div>
            )}
          </div>

          {/* Browser Capture Wrapper */}
          <div style={{ 
            position: 'relative', 
            borderRadius: '8px', 
            overflow: 'hidden', 
            border: '1px solid var(--border)',
            background: '#090a0f',
            aspectRatio: '4/3',
            display: 'grid',
            placeItems: 'center'
          }}>
            {selectedScreenshot ? (
              <>
                <img 
                  src={getFullUrl(selectedScreenshot.path)} 
                  alt={`${selectedScreenshot.name} snapshot`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                {/* Active scan line sweep animation overlay */}
                <div className="scanner-line" />
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                <Eye size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                <span>No screenshots captured</span>
              </div>
            )}
          </div>
        </div>

        {/* DOM Evidence / Observation details */}
        <div className="investigation-canvas" style={{ gridTemplateColumns: '1fr', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '10px' }}>
            <Compass size={18} style={{ color: '#06b6d4' }} />
            <span className="eyebrow" style={{ letterSpacing: '0.05em', color: '#06b6d4' }}>Runtime Evidence Harvested</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block', fontWeight: 700 }}>EXPECTED BEHAVIOR</span>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text)' }}>{evidence.expected_interaction || 'Clear completed todo items.'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block', fontWeight: 700 }}>OBSERVED DOM CHANGE</span>
              <p style={{ margin: '4px 0 0 0', color: 'var(--danger)' }}>{evidence.observed_dom_change || 'No change detected in active todo items counts.'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block', fontWeight: 700 }}>VISUAL OUTCOME</span>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{evidence.observed_visual_change || 'Todo remains visible.'}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Logs and Network failures */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div className="panel-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Terminal size={14} style={{ color: 'var(--text-secondary)' }} />
            <h4 style={{ margin: 0, fontSize: '13px', letterSpacing: '-0.01em' }}>Console Output</h4>
          </div>
          {consoleEvents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>No console logs recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px' }}>
              {consoleEvents.map((evt: any, i: number) => (
                <div key={i} style={{ color: evt.severity === 'error' ? 'var(--danger)' : evt.severity === 'warning' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                  [{evt.severity?.toUpperCase()}] {evt.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Server size={14} style={{ color: 'var(--text-secondary)' }} />
            <h4 style={{ margin: 0, fontSize: '13px', letterSpacing: '-0.01em' }}>Network Activity</h4>
          </div>
          {networkFailures.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>No network failures recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', fontSize: '11px' }}>
              {networkFailures.map((net: any, i: number) => (
                <div key={i} style={{ color: 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{net.method} {net.url}</span>
                  <strong>{net.status}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. Source Mapper Visualizer
// ---------------------------------------------------------------------------

export function SourceMapperVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Source Mapper" />

  const files = data.candidate_files || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSearch size={18} style={{ color: 'var(--signal-bright)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 650, letterSpacing: '-0.02em' }}>Mapped AST Nodes</h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Target: <code style={{ color: 'var(--signal-bright)' }}>{data.target_observation || 'Clear completed button'}</code>
        </span>
      </div>

      {files.length === 0 ? (
        <div className="panel-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No source file candidates mapped.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {files.map((file: any, i: number) => (
            <div key={i} className="panel-card" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)' }}>
              {/* File Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <FileCode size={16} style={{ color: 'var(--signal-bright)' }} />
                  <strong style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                    {file.file_path}
                  </strong>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <ConfidenceBadge level={file.heuristic_confidence >= 0.8 ? 'High' : file.heuristic_confidence >= 0.5 ? 'Medium' : 'Low'} />
                </div>
              </div>

              {/* Components inside the file */}
              {(file.components || []).map((comp: any, ci: number) => (
                <div key={ci} style={{ borderLeft: '2px solid var(--border)', paddingLeft: '12px', marginLeft: '6px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Cpu size={13} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Component: {comp.component_name}</span>
                  </div>

                  {/* Matching nodes/snippet */}
                  {(comp.matching_nodes || []).map((node: any, ni: number) => (
                    <div key={ni} style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Match Heuristic: {node.match_reason}</span>
                        <span>Lines {node.line_start}-{node.line_end}</span>
                      </div>
                      <CodeBlock code={node.snippet} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. Analyzer Visualizer
// ---------------------------------------------------------------------------

export function AnalyzerVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Analyzer" />

  const hypotheses = data.competing_hypotheses || []
  const conclusion = data.conclusion || {}
  const repairCtx = data.repair_context || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Conclusion Card */}
      <div className="investigation-canvas" style={{ gridTemplateColumns: '1fr', padding: '20px', border: '1px solid rgba(16, 185, 129, 0.25)', background: 'radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.1), transparent 12rem), linear-gradient(125deg, #0f1614, #080c0b)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={20} style={{ color: '#10b981' }} />
            <span className="eyebrow" style={{ color: '#10b981' }}>CONVERGED CONCLUSION</span>
          </div>
          <ConfidenceBadge level={conclusion.investigation_confidence || 'High'} />
        </div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, lineHeight: '1.4', color: 'var(--text)' }}>
          {conclusion.root_cause || 'Root cause identified.'}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          {conclusion.confidence_rationale}
        </p>
      </div>

      {/* Competing Hypotheses */}
      <div>
        <h4 className="eyebrow" style={{ marginBottom: '10px' }}>COMPETING HYPOTHESES EVALUATION</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hypotheses.map((hyp: any, i: number) => {
            const isFavored = hyp.plausibility_score === 'High'
            return (
              <div 
                key={i} 
                className="panel-card" 
                style={{ 
                  padding: '14px', 
                  border: isFavored ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)',
                  background: isFavored ? 'rgba(16, 185, 129, 0.02)' : 'var(--surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        background: isFavored ? '#10b981' : 'var(--surface-raised)', 
                        color: isFavored ? 'black' : 'var(--text-muted)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '10px',
                        fontWeight: 800
                      }}
                    >
                      {i + 1}
                    </span>
                    <strong style={{ fontSize: '13px', color: isFavored ? 'var(--text)' : 'var(--text-secondary)' }}>
                      {hyp.hypothesis}
                    </strong>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isFavored ? '#10b981' : 'var(--text-muted)' }}>
                    Plausibility: {hyp.plausibility_score}
                  </span>
                </div>

                <div style={{ paddingLeft: '26px', fontSize: '12px' }}>
                  {/* Support evidence list */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {(hyp.supporting_evidence || []).map((e: string, idx: number) => (
                      <span key={idx} style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontSize: '10px' }}>
                        + {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Repair Objectives */}
      {repairCtx.repair_objectives && (
        <div className="panel-card" style={{ padding: '16px' }}>
          <h4 className="eyebrow" style={{ marginBottom: '8px' }}>REPAIR OBJECTIVES</h4>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {repairCtx.repair_objectives.map((obj: string, i: number) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. Repair Visualizer (Patch/Diff Viewer)
// ---------------------------------------------------------------------------

export function RepairVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Repair" />

  const diffs = data.diff || []
  const target = data.target_file || 'target-app/src/App.tsx'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wrench size={18} style={{ color: 'var(--signal-bright)' }} />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 650, letterSpacing: '-0.02em' }}>Surgical Patch Diff</h3>
        </div>
        <ConfidenceBadge level={data.repair_confidence || 'High'} />
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        <p style={{ margin: '0 0 10px 0' }}>{data.patch_explanation}</p>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Target File: <code style={{ color: 'var(--signal-bright)' }}>{target}</code>
        </span>
      </div>

      {diffs.length === 0 ? (
        <div className="panel-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No diff blocks generated.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {diffs.map((diff: any, idx: number) => (
            <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#07080c', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <span className="eyebrow" style={{ fontSize: '9px', color: '#ef4444' }}>SEARCH FOR (ORIGINAL)</span>
                <pre style={{ margin: '6px 0 0 0', padding: 0, fontSize: '12px', color: '#f87171', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {diff.search_block}
                </pre>
              </div>
              <div style={{ background: '#0a0f0d', padding: '12px' }}>
                <span className="eyebrow" style={{ fontSize: '9px', color: '#10b981' }}>REPLACE WITH (PATCHED)</span>
                <pre style={{ margin: '6px 0 0 0', padding: 0, fontSize: '12px', color: '#34d399', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {diff.replace_block}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risks */}
      {data.repair_risks && data.repair_risks.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.02)', color: '#f59e0b', fontSize: '12px' }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span><strong>Risk Assessment:</strong> {data.repair_risks.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. Verifier Visualizer
// ---------------------------------------------------------------------------

export function VerifierVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Verifier" />

  const passed = data.verification_status === 'Passed'
  const inconclusive = data.verification_status === 'Inconclusive'
  const steps = data.executed_steps || []
  const regressions = data.regressions_detected || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Verification status header */}
      <div 
        className="investigation-canvas" 
        style={{ 
          gridTemplateColumns: '1fr', 
          padding: '20px', 
          border: passed 
            ? '1px solid rgba(16, 185, 129, 0.25)' 
            : inconclusive 
              ? '1px solid rgba(245, 158, 11, 0.25)' 
              : '1px solid rgba(239, 68, 68, 0.25)', 
          background: passed 
            ? 'radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.1), transparent 12rem), linear-gradient(125deg, #0f1614, #080c0b)' 
            : inconclusive
              ? 'radial-gradient(circle at 10% 10%, rgba(245, 158, 11, 0.1), transparent 12rem), linear-gradient(125deg, #18150f, #0d0b08)'
              : 'radial-gradient(circle at 10% 10%, rgba(239, 68, 68, 0.1), transparent 12rem), linear-gradient(125deg, #180f0f, #0d0808)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <ShieldCheck size={22} style={{ color: passed ? '#10b981' : inconclusive ? '#f59e0b' : '#ef4444' }} />
          <span className="eyebrow" style={{ color: passed ? '#10b981' : inconclusive ? '#f59e0b' : '#ef4444' }}>
            VERIFICATION {data.verification_status?.toUpperCase() || 'COMPLETE'}
          </span>
        </div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
          {data.pass_fail_reason || 'Verification process completed.'}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Rollback Triggered: <strong style={{ color: data.rollback_required ? 'var(--danger)' : 'var(--success)' }}>{data.rollback_required ? 'YES (Restoring baseline)' : 'NO (Patch preserved)'}</strong>
        </p>
      </div>

      {/* Executed steps / assertions */}
      <div>
        <h4 className="eyebrow" style={{ marginBottom: '10px' }}>EXECUTED PLAYWRIGHT ASSERTIONS</h4>
        {steps.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>No steps executed.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {steps.map((step: any, idx: number) => (
              <div key={idx} className="panel-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text)' }}>
                    {step.action}({step.selector}) {step.value ? `-> "${step.value}"` : ''} {step.expected ? `[Expected: "${step.expected}"]` : ''}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>PASS</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regressions log */}
      {regressions.length > 0 && (
        <div className="panel-card" style={{ padding: '14px', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', marginBottom: '8px' }}>
            <AlertTriangle size={15} />
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Regressions Detected</h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {regressions.map((reg: string, idx: number) => (
              <li key={idx}>{reg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 6. Empty State / Loading helper
// ---------------------------------------------------------------------------

function EmptyState({ stage }: { stage: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '12px', background: 'rgba(0,0,0,0.08)' }}>
      <HelpCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
      <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 650, color: 'var(--text-secondary)' }}>
        No details available for {stage}
      </h3>
      <p style={{ margin: 0, fontSize: '12px', maxWidth: '300px', textAlign: 'center', lineHeight: '1.4' }}>
        The pipeline must reach or complete this stage during execution before snapshot artifacts become accessible.
      </p>
    </div>
  )
}
