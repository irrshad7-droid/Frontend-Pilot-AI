import { useState } from 'react'
import { ArrowRight, Braces, CircleCheck, Eye, FileSearch, Play, Sparkles, Wrench } from 'lucide-react'
import { AppShell } from '../../components/chrome/AppShell'
import { navigateToRun } from '../../hooks/useHashRoute'
import { demoRun } from '../../fixtures/demoRun'
import { startPipeline } from '../../api/pipeline'

const stages = [
  ['Observe', 'ExplorerSnapshot', Eye],
  ['Map', 'SourceSnapshot', FileSearch],
  ['Reason', 'AnalysisSnapshot', Sparkles],
  ['Repair', 'RepairSnapshot', Wrench],
  ['Verify', 'VerificationSnapshot', CircleCheck],
] as const

export function LandingPage() {
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function handleStartRealRun() {
    setStarting(true)
    setStartError(null)
    try {
      const result = await startPipeline()
      navigateToRun(result.run_id)
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err))
    } finally {
      setStarting(false)
    }
  }

  return (
    <AppShell>
      <main className="landing-page">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span className="pulse-dot" /> Autonomous frontend quality</p>
            <h1>See the repair,<br /><span>not just the result.</span></h1>
            <p className="hero-description">
              FrontendPilot AI investigates frontend failures from browser evidence to a verified repair.
            </p>
            <div className="hero-scenario">
              <span>Reported issue · Todo App</span>
              <strong>\u201cClear completed\u201d does nothing.</strong>
              <small>Browser evidence → source mapping → verified repair</small>
            </div>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => navigateToRun(demoRun.id)}>
                Explore a demo run <ArrowRight size={17} />
              </button>
              <button
                className="primary-button"
                onClick={handleStartRealRun}
                disabled={starting}
                style={{ background: 'transparent', color: 'var(--signal-bright)', borderColor: 'var(--signal)' }}
              >
                {starting ? 'Starting…' : 'Start a real run'} <Play size={15} />
              </button>
            </div>
            {startError && (
              <p style={{ marginTop: '12px', color: 'var(--danger)', fontSize: '12px', lineHeight: '1.5' }}>
                {startError}
              </p>
            )}
            <span className="quiet-label" style={{ marginTop: '12px' }}><Braces size={15} /> Snapshot-driven by design</span>
          </div>
          <aside className="hero-orbit" aria-label="Pipeline overview">
            <div className="orbit-grid" />
          <div className="orbit-core"><Sparkles size={28} /><span>TRACE</span></div>
            {stages.map(([name, snapshot, Icon], index) => (
              <div className={`orbit-stage orbit-stage-${index + 1}`} key={name}>
                <Icon size={17} /><div><strong>{name}</strong><small>{snapshot}</small></div>
              </div>
            ))}
          </aside>
        </section>

        <section className="landing-footer-grid">
          <div><p className="eyebrow">The control loop</p><p>Every decision is preserved as inspectable evidence—not hidden behind a chat response.</p></div>
          <div><p className="eyebrow">Built for confidence</p><p>Source mapping, exact-match patches, and deterministic browser verification stay in view.</p></div>
          <div><p className="eyebrow">One coherent investigation</p><p>Follow a reported UI failure through each decision that leads to a safe repair.</p></div>
        </section>
      </main>
    </AppShell>
  )
}
