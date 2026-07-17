import { ArrowRight, Braces, CircleCheck, Eye, FileSearch, Sparkles, Wrench } from 'lucide-react'
import { AppShell } from '../../components/chrome/AppShell'
import { navigateToRun } from '../../hooks/useHashRoute'
import { demoRun } from '../../fixtures/demoRun'

const stages = [
  ['Observe', 'ExplorerSnapshot', Eye],
  ['Map', 'SourceSnapshot', FileSearch],
  ['Reason', 'AnalysisSnapshot', Sparkles],
  ['Repair', 'RepairSnapshot', Wrench],
  ['Verify', 'VerificationSnapshot', CircleCheck],
] as const

export function LandingPage() {
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
              <strong>“Clear completed” does nothing.</strong>
              <small>Browser evidence → source mapping → verified repair</small>
            </div>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => navigateToRun(demoRun.id)}>
                Watch an autonomous repair <ArrowRight size={17} />
              </button>
              <span className="quiet-label"><Braces size={15} /> Snapshot-driven by design</span>
            </div>
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
