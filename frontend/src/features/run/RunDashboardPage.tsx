import { ChevronRight, Clock3, ExternalLink, FileWarning, Radio, ScanSearch } from 'lucide-react'
import { useState } from 'react'
import { AppShell } from '../../components/chrome/AppShell'
import { StageRail } from '../../components/chrome/StageRail'
import { StatusBadge } from '../../components/data-display/StatusBadge'
import { demoRun } from '../../fixtures/demoRun'
import type { PipelineStage } from '../../types/pipeline'

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

export function RunDashboardPage() {
  const [demoState, setDemoState] = useState<'Running' | 'Verified' | 'Rolled back'>('Running');
  
  const mappedStatus = demoState === 'Running' ? 'Running' : demoState === 'Verified' ? 'Success' : 'Failed';

  const currentRun = {
    ...demoRun,
    status: mappedStatus as 'Running' | 'Success' | 'Failed',
    stages: demoRun.stages.map(stage => {
      if (demoState === 'Verified') return { ...stage, status: 'complete' as const };
      if (demoState === 'Rolled back') {
        if (stage.id === 'verifier') return { ...stage, status: 'failed' as const };
        if (stage.id === 'repair' || stage.id === 'analyzer') return { ...stage, status: 'complete' as const };
      }
      return stage;
    })
  };

  const activeStage = currentRun.stages.find((stage) => stage.status === 'running') ?? currentRun.stages[currentRun.stages.length - 1]

  return (
    <AppShell showBack>
      <main className="dashboard-page">
        <StageRail stages={currentRun.stages} />
        <section className="workspace">
          <div className="run-breadcrumb">
            <span>Runs</span><ChevronRight size={14} /><strong>{currentRun.id}</strong>
            <span className="demo-chip">Demo scenario</span>
            
            <div className="demo-controls" style={{ marginLeft: 'auto', display: 'flex', gap: '8px', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button onClick={() => setDemoState('Running')} className={demoState === 'Running' ? 'demo-active' : ''} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', color: demoState === 'Running' ? 'var(--bg)' : 'var(--text-muted)', background: demoState === 'Running' ? 'var(--signal-bright)' : 'transparent' }}>Running</button>
              <button onClick={() => setDemoState('Verified')} className={demoState === 'Verified' ? 'demo-active' : ''} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', color: demoState === 'Verified' ? 'var(--bg)' : 'var(--text-muted)', background: demoState === 'Verified' ? 'var(--success)' : 'transparent' }}>Verified</button>
              <button onClick={() => setDemoState('Rolled back')} className={demoState === 'Rolled back' ? 'demo-active' : ''} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', color: demoState === 'Rolled back' ? 'var(--bg)' : 'var(--text-muted)', background: demoState === 'Rolled back' ? 'var(--danger)' : 'transparent' }}>Rolled back</button>
            </div>
          </div>
          <header className="run-header">
            <div>
              <p className="eyebrow">Autonomous investigation · {currentRun.targetName}</p>
              <h1>{currentRun.issue}</h1>
              <p className="run-target"><ExternalLink size={14} /> {currentRun.targetUrl}</p>
            </div>
            <div className="run-status-cluster">
              <StatusBadge status={currentRun.status} />
              <span><Clock3 size={14} /> {currentRun.elapsed}</span>
            </div>
          </header>

          <section className="run-context-grid" aria-label="Run context">
            <div><span>Target</span><strong>{currentRun.targetName}</strong></div>
            <div className="context-issue"><span>Observed behavior</span><strong>{currentRun.observedBehavior}</strong></div>
            <div><span>Current stage</span><strong>{activeStage.name}</strong></div>
          </section>

          <MobilePipeline stages={currentRun.stages} />

          <section className="dashboard-content">
            <article className="focus-panel">
              <div className="panel-heading">
                <div><p className="eyebrow"><Radio size={13} className="pulsing-icon" /> Active investigation stage</p><h2>{activeStage.name}</h2></div>
                <StatusBadge status={activeStage.status} />
              </div>
              <p className="focus-summary">{activeStage.summary}</p>
              
              <div className="investigation-canvas">
                <div className="canvas-root-cause">
                  <ScanSearch size={20} />
                  <span>Evidence convergence</span>
                  <strong>{activeStage.insight}</strong>
                </div>
                <ol className="hypothesis-list">
                  {activeStage.facts.map((fact, index) => (
                    <li className={index === 0 ? 'favored-hypothesis' : ''} key={fact}>
                      <span>{index + 1}</span>{fact}
                    </li>
                  ))}
                </ol>
              </div>
            </article>
            
            <aside className="side-stack">
              <article className="panel-card">
                <div className="panel-heading"><div><p className="eyebrow">Investigation timeline</p><h3>How the signal narrowed</h3></div><FileWarning size={18} /></div>
                <ol className="event-list">
                  {currentRun.stages.map((s, i) => (
                    <li key={s.id}><span className={`event-dot ${s.status === 'running' ? 'running pulse' : s.status === 'complete' ? 'complete' : s.status === 'failed' ? 'failed' : 'queued'}`} />{s.progress} <time>0{i + 1}</time></li>
                  ))}
                </ol>
              </article>
              <article className="panel-card contract-card">
                <p className="eyebrow">Current handoff</p><code>{activeStage.snapshot}</code>
                <p>{activeStage.progress}. The next decision stays bounded by the evidence collected so far.</p>
              </article>
            </aside>
          </section>

        </section>
      </main>
    </AppShell>
  )
}
