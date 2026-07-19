import { useState } from 'react'
import { ArrowRight, Braces, Play, Compass, FileSearch, BrainCircuit, Wrench, ShieldCheck, Terminal, Code, CheckCircle2, Cpu } from 'lucide-react'
import { AppShell } from '../../components/chrome/AppShell'
import { navigateToRun } from '../../hooks/useHashRoute'
import { demoRun } from '../../fixtures/demoRun'
import { startPipeline } from '../../api/pipeline'

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
      <main className="landing-page" style={{ padding: 'clamp(32px, 8vh, 80px) clamp(16px, 4vw, 40px)' }}>
        
        {/* Hero Section */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center', marginBottom: '80px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Tag / Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid rgba(139, 140, 255, 0.15)', borderRadius: '999px', background: 'var(--signal-soft)', width: 'fit-content' }}>
              <span className="pulse-dot" />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--signal-bright)' }}>
                Autonomous Quality Agent
              </span>
            </div>

            {/* High-Impact Heading */}
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 62px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', margin: 0 }}>
              Your frontend broke.<br />
              <span style={{ background: 'linear-gradient(to right, var(--signal-bright), var(--success))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Watch AI fix it.
              </span>
            </h1>

            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: '520px' }}>
              FrontendPilot AI is an autonomous agent that runs target apps in Playwright, maps runtime errors to JSX nodes via AST, and applies verified, regression-free patches.
            </p>

            {/* Curated Incident Stakes Card */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.01)', maxWidth: '520px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="eyebrow" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>DEMO INCIDENT TARGET</span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(251, 113, 133, 0.1)', color: 'var(--danger)', fontWeight: 700 }}>BUG DETECTED</span>
              </div>
              <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text)' }}>"Clear completed" does nothing</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                Playwright reproduced a UI state mismatch on <code>http://localhost:5173</code> where completed todos remain in the list.
              </span>
            </div>

            {/* Main Action CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <button 
                className="primary-button" 
                onClick={() => navigateToRun(demoRun.id)}
                style={{ fontSize: '13px', padding: '12px 20px' }}
              >
                Explore Demo Run <ArrowRight size={16} />
              </button>
              
              <button
                className="primary-button"
                onClick={handleStartRealRun}
                disabled={starting}
                style={{ 
                  background: 'transparent', 
                  color: 'var(--signal-bright)', 
                  borderColor: 'var(--signal)',
                  fontSize: '13px',
                  padding: '12px 20px'
                }}
              >
                {starting ? 'Starting Agent…' : 'Start a Real Run'} <Play size={14} style={{ fill: 'currentColor', marginLeft: '6px' }} />
              </button>
            </div>

            {startError && (
              <p style={{ color: 'var(--danger)', fontSize: '12px', margin: 0 }}>
                {startError}
              </p>
            )}

            {/* Trust and stack items */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <span className="quiet-label" style={{ fontSize: '11px' }}><Braces size={13} /> AST mapping</span>
              <span className="quiet-label" style={{ fontSize: '11px' }}><Cpu size={13} /> OpenAI gpt-4o</span>
            </div>

          </div>

          {/* Keynote Visual Mockup: The Autonomous Cycle */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px', justifySelf: 'center' }}>
            <div className="hero-orbit" style={{ padding: '16px', background: '#090a0f', minHeight: 'auto', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow)' }}>
              
              {/* Fake IDE Header / App Window */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '14px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '8px', fontFamily: 'monospace' }}>frontendpilot-agent.log</span>
              </div>

              {/* Simulated Agent Logs Terminal */}
              <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', color: '#94a3b8' }}>
                <div style={{ color: 'var(--signal-bright)', display: 'flex', gap: '8px' }}>
                  <span>$</span>
                  <span>frontendpilot start http://localhost:5173</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span style={{ color: '#10b981' }}>[OK]</span>
                  <span>Playwright connected to target. Scanning DOM...</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#10b981' }}>[OK]</span>
                  <span>Captured failure evidence: todo list height did not reset.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--signal-bright)' }}>[AST]</span>
                  <span>Mapped target to target-app/src/App.tsx line 104</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: 'var(--warning)' }}>
                  <span>[LLM]</span>
                  <span>Synthesizing structural patches... (confidence: High)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: '#10b981' }}>
                  <span>[OK]</span>
                  <span>Syntax checked via tsc --noEmit. Verification Passed.</span>
                </div>
              </div>

              {/* Small Visual Patch Code Overlay */}
              <div style={{ marginTop: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '10px', background: 'rgba(16, 185, 129, 0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 800 }}>SURGICAL REPAIR</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>App.tsx:104</span>
                </div>
                <pre style={{ margin: 0, fontSize: '10px', fontFamily: 'monospace', color: '#34d399' }}>
                  {`- <button className="hover:underline">\n+ <button onClick={handleClearCompleted} className="hover:underline">`}
                </pre>
              </div>

            </div>
          </div>

        </section>

        {/* Pipeline Process Strip (PRIORITY 3: Clear 5-second visualization) */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '32px' }}>
            THE AUTONOMOUS EXECUTION LOOP
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            
            <div className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'grid', placeItems: 'center' }}>
                <Compass size={18} />
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text)' }}>1. Explorer</strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Runs target app via Playwright, replicates journeys, and captures DOM elements.
              </p>
            </div>

            <div className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'grid', placeItems: 'center' }}>
                <FileSearch size={18} />
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text)' }}>2. Source Mapper</strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                AST parser traverses workspace source files to identify buggy code candidates.
              </p>
            </div>

            <div className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'grid', placeItems: 'center' }}>
                <BrainCircuit size={18} />
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text)' }}>3. Analyzer</strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Correlates data logs and constructs root cause hypotheses using OpenAI models.
              </p>
            </div>

            <div className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'grid', placeItems: 'center' }}>
                <Wrench size={18} />
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text)' }}>4. Repair Agent</strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Synthesizes surgical search/replace patches verified against static syntaxes.
              </p>
            </div>

            <div className="panel-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'grid', placeItems: 'center' }}>
                <ShieldCheck size={18} />
              </div>
              <strong style={{ fontSize: '14px', color: 'var(--text)' }}>5. Verifier</strong>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Runs verification assertions without an LLM. Triggers git rollback on failure.
              </p>
            </div>

          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="landing-footer-grid" style={{ borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Terminal size={16} style={{ color: 'var(--signal-bright)' }} />
              <p className="eyebrow" style={{ margin: 0 }}>CLI & Dev Server Bindings</p>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Binds cleanly to Vite dev processes. Watches element IDs and logs error traces seamlessly.
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Code size={16} style={{ color: 'var(--signal-bright)' }} />
              <p className="eyebrow" style={{ margin: 0 }}>Surgical Patches Only</p>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Never rewrites entire files. Replaces only targeted AST block candidates to minimize system regressions.
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--signal-bright)' }} />
              <p className="eyebrow" style={{ margin: 0 }}>Deterministic Verification</p>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Proves patches work in browser tests before persistence. Rolls back automatically via Git on regression.
            </p>
          </div>
        </section>

      </main>
    </AppShell>
  )
}
