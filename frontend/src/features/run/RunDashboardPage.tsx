import { ChevronRight, Clock3, ExternalLink, FileWarning, Radio } from 'lucide-react'
import { useState } from 'react'
import { AppShell } from '../../components/chrome/AppShell'
import { StageRail } from '../../components/chrome/StageRail'
import { StatusBadge } from '../../components/data-display/StatusBadge'
import { demoRun } from '../../fixtures/demoRun'
import type { PipelineStage } from '../../types/pipeline'
import { ExplorerVisualizer, SourceMapperVisualizer, AnalyzerVisualizer, RepairVisualizer, VerifierVisualizer } from '../../components/run/StageVisualizers'

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

  // Mock snapshots representing the Todo App Clear completed bug lifecycle
  const mockSnapshot = {
    explorer_snapshot: {
      page_summary: {
        title: "Todo App",
        current_url: "http://localhost:5173",
        total_interactive_elements: 14,
        button_count: 3,
        input_count: 1
      },
      runtime_evidence: {
        expected_interaction: "Add a new todo, complete it, and click 'Clear completed' button.",
        observed_dom_change: "The completed todo item was not cleared from the DOM, and remained in the list view.",
        observed_visual_change: "Visual line-through state was preserved, but item list height did not adjust.",
        observed_element_state: "'Clear completed' control is active and was clicked, but has no attached event listeners."
      },
      console_events: [
        { severity: 'info', message: 'Vite HMR connected' },
        { severity: 'info', message: 'Todo initialized with 3 default items' }
      ],
      network_failures: []
    },
    source_snapshot: {
      target_observation: "Clear completed button element",
      candidate_files: [
        {
          file_path: "target-app/src/App.tsx",
          heuristic_confidence: 0.9,
          components: [
            {
              component_name: "App",
              heuristic_confidence: 0.9,
              matching_nodes: [
                {
                  node_type: "jsx_element",
                  line_start: 104,
                  line_end: 108,
                  match_reason: "Matches text 'Clear completed' inside button element without onClick attribute",
                  heuristic_confidence: 0.9,
                  snippet: `<button className="hover:underline hover:text-gray-800 transition-colors">\n  Clear completed\n</button>`
                }
              ]
            }
          ]
        }
      ]
    },
    analysis_snapshot: {
      conclusion: {
        root_cause: "Missing onClick handler on the 'Clear completed' button component.",
        confidence_rationale: "AST traversal identifies the JSX button with text matching the interaction target. The parser confirms it lacks any event bindings, causing action dispatch to default to a no-op.",
        investigation_confidence: "High"
      },
      competing_hypotheses: [
        {
          hypothesis: "No onClick event handler assigned to button element.",
          plausibility_score: "High",
          supporting_evidence: ["JSX AST matches target label and is missing handler attributes"]
        },
        {
          hypothesis: "State mutation code inside App component is faulty.",
          plausibility_score: "Medium",
          supporting_evidence: ["State list is maintained via React useState hooks"]
        }
      ],
      repair_context: {
        repair_objectives: [
          "Bind click listener to the Clear completed button element.",
          "Invoke filtering logic on click to purge completed items from state."
        ]
      }
    },
    repair_snapshot: {
      target_file: "target-app/src/App.tsx",
      patch_explanation: "Binds the Clear completed button onClick handler to trigger handleClearCompleted state filtering.",
      repair_confidence: "High",
      diff: [
        {
          search_block: `<button className="hover:underline hover:text-gray-800 transition-colors">\n  Clear completed\n</button>`,
          replace_block: `<button \n  onClick={handleClearCompleted}\n  className="hover:underline hover:text-gray-800 transition-colors"\n>\n  Clear completed\n</button>`
        }
      ],
      repair_risks: ["Low risk. Purely binds local event listener to filter existing state array."]
    },
    verification_snapshot: {
      verification_status: demoState === 'Verified' ? 'Passed' : demoState === 'Rolled back' ? 'Failed' : 'Inconclusive',
      pass_fail_reason: demoState === 'Verified' 
        ? "All verification assertions passed. Todo item was purged and list height recalculated."
        : demoState === 'Rolled back'
          ? "Verification failed: assertion timeout on todo list purge."
          : "Verification pending.",
      rollback_required: demoState === 'Rolled back',
      executed_steps: [
        { action: "click", selector: "button:has-text('Clear completed')" },
        { action: "assert_not_visible", selector: ".todo-item.completed" }
      ],
      regressions_detected: demoState === 'Rolled back' ? ["Verification assertion timeout on todo list purge."] : []
    }
  };

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
              <div className="panel-heading" style={{ marginBottom: '16px' }}>
                <div><p className="eyebrow"><Radio size={13} className="pulsing-icon" /> Active investigation stage</p><h2>{activeStage.name}</h2></div>
                <StatusBadge status={activeStage.status} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeStage.id === 'explorer' && (
                  <ExplorerVisualizer data={mockSnapshot.explorer_snapshot} />
                )}
                {activeStage.id === 'mapper' && (
                  <SourceMapperVisualizer data={mockSnapshot.source_snapshot} />
                )}
                {activeStage.id === 'analyzer' && (
                  <AnalyzerVisualizer data={mockSnapshot.analysis_snapshot} />
                )}
                {activeStage.id === 'repair' && (
                  <RepairVisualizer data={
                    demoState === 'Running' ? null : mockSnapshot.repair_snapshot
                  } />
                )}
                {activeStage.id === 'verifier' && (
                  <VerifierVisualizer data={
                    demoState === 'Running' ? null : mockSnapshot.verification_snapshot
                  } />
                )}
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
