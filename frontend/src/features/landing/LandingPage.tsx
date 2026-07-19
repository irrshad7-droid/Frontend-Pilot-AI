import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Braces, Play, Compass, FileSearch, BrainCircuit, Wrench, ShieldCheck, Terminal, Code, CheckCircle2, Cpu, MousePointer2, AlertCircle } from 'lucide-react'
import { AppShell } from '../../components/chrome/AppShell'
import { navigateToRun } from '../../hooks/useHashRoute'
import { demoRun } from '../../fixtures/demoRun'
import { startPipeline } from '../../api/pipeline'

const TERMINAL_LINES = [
  { prefix: '$', text: 'frontendpilot start http://localhost:5173', color: 'var(--signal-bright)' },
  { prefix: '[OK]', text: 'Playwright connected to target. Scanning DOM...', color: '#10b981' },
  { prefix: '[OK]', text: 'Captured failure evidence: todo list height did not reset.', color: '#10b981' },
  { prefix: '[AST]', text: 'Mapped target to target-app/src/App.tsx line 104', color: 'var(--signal-bright)' },
  { prefix: '[LLM]', text: 'Synthesizing structural patches... (confidence: High)', color: 'var(--warning)' },
  { prefix: '[OK]', text: 'Applied verified, regression-free patch to source.', color: '#10b981' }
]

function TypewriterTerminal() {
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [completedLines, setCompletedLines] = useState<typeof TERMINAL_LINES>([])

  useEffect(() => {
    if (lineIndex >= TERMINAL_LINES.length) return

    const currentLine = TERMINAL_LINES[lineIndex]
    if (charIndex < currentLine.text.length) {
      const delay = currentLine.prefix === '$' ? 30 : 12
      const timer = setTimeout(() => {
        setCharIndex(prev => prev + 1)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setCompletedLines(prev => [...prev, currentLine])
        setLineIndex(prev => prev + 1)
        setCharIndex(0)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [lineIndex, charIndex])

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', color: '#94a3b8', minHeight: '120px' }}>
      {completedLines.map((line, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '8px', marginTop: idx > 0 ? '6px' : 0 }}>
          <span style={{ color: line.color, fontWeight: 700 }}>{line.prefix}</span>
          <span style={{ color: line.prefix === '$' ? 'var(--text)' : undefined }}>{line.text}</span>
        </div>
      ))}
      {lineIndex < TERMINAL_LINES.length && (
        <div style={{ display: 'flex', gap: '8px', marginTop: lineIndex > 0 ? '6px' : 0 }}>
          <span style={{ color: TERMINAL_LINES[lineIndex].color, fontWeight: 700 }}>{TERMINAL_LINES[lineIndex].prefix}</span>
          <span style={{ color: TERMINAL_LINES[lineIndex].prefix === '$' ? 'var(--text)' : undefined, display: 'inline-flex', alignItems: 'center' }}>
            {TERMINAL_LINES[lineIndex].text.slice(0, charIndex)}
            <span className="terminal-caret" style={{ display: 'inline-block', width: '6px', height: '11px', background: 'var(--text-secondary)', marginLeft: '2px' }} />
          </span>
        </div>
      )}
    </div>
  )
}

const SIMULATION_STEPS = [
  {
    log: "Connecting to dev server: http://localhost:5173",
    status: "connecting",
    cursor: { top: '80%', left: '80%' },
    highlight: null,
    todos: [
      { text: "Complete hackathon deck", done: true },
      { text: "Deploy presentation visualizers", done: false }
    ],
    inputText: "",
    error: false
  },
  {
    log: "Dev server active. Launching Playwright Chromium sandbox...",
    status: "playwright",
    cursor: { top: '80%', left: '80%' },
    highlight: null,
    todos: [
      { text: "Complete hackathon deck", done: true },
      { text: "Deploy presentation visualizers", done: false }
    ],
    inputText: "",
    error: false
  },
  {
    log: "Target app loaded. Easing cursor toward todo text input...",
    status: "navigating",
    cursor: { top: '25%', left: '30%' },
    highlight: { top: '61px', left: '34px', width: '382px', height: '28px', isError: false },
    todos: [
      { text: "Complete hackathon deck", done: true },
      { text: "Deploy presentation visualizers", done: false }
    ],
    inputText: "",
    error: false
  },
  {
    log: "Auto-typing testing criteria: \"Clear completed does nothing\"",
    status: "typing",
    cursor: { top: '25%', left: '30%' },
    highlight: { top: '61px', left: '34px', width: '382px', height: '28px', isError: false },
    todos: [
      { text: "Complete hackathon deck", done: true },
      { text: "Deploy presentation visualizers", done: false }
    ],
    inputText: "Clear completed does nothing",
    error: false
  },
  {
    log: "Cursor moving toward the checkbox...",
    status: "hovering",
    cursor: { top: '64%', left: '72%' },
    highlight: { top: '120px', left: '40px', width: '360px', height: '32px', isError: false },
    todos: [
      { text: "Complete hackathon deck", done: true },
      { text: "Deploy presentation visualizers", done: false }
    ],
    inputText: "",
    error: false
  },
  {
    log: "Checkbox highlighted. Preparing click...",
    status: "clicking",
    cursor: { top: '64%', left: '72%' },
    highlight: { top: '120px', left: '40px', width: '360px', height: '32px', isError: false },
    todos: [
      { text: "Complete hackathon deck", done: true },
      { text: "Deploy presentation visualizers", done: false }
    ],
    inputText: "",
    error: false
  },
  {
    log: "Checkbox toggled. Completed item now marked finished.",
    status: "confirmed",
    cursor: { top: '64%', left: '72%' },
    highlight: { top: '120px', left: '40px', width: '360px', height: '32px', isError: false },
    todos: [
      { text: "Complete hackathon deck", done: true },
      { text: "Deploy presentation visualizers", done: true }
    ],
    inputText: "",
    error: false
  },
  {
    log: "WARNING: UI state mismatch detected! Completed todos remain visible.",
    status: "warning",
    cursor: { top: '64%', left: '72%' },
    highlight: { top: '96px', left: '34px', width: '382px', height: '32px', isError: true },
    todos: [
      { text: "Complete hackathon deck", done: true },
      { text: "Deploy presentation visualizers", done: true }
    ],
    inputText: "",
    error: true
  }
]

const STEP_DURATIONS = [1400, 1800, 2000, 2200, 1800, 1800, 2200, 3200]

function SimulatedExplorerBrowser() {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    if (stepIdx >= SIMULATION_STEPS.length - 1) return

    const timer = window.setTimeout(() => {
      setStepIdx(prev => (prev < SIMULATION_STEPS.length - 1 ? prev + 1 : prev))
    }, STEP_DURATIONS[stepIdx] ?? 2200)

    return () => window.clearTimeout(timer)
  }, [stepIdx])

  const step = SIMULATION_STEPS[stepIdx]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '24px', alignItems: 'stretch' }}>
      {/* Simulation Sync Logs */}
      <div className="panel-card" style={{ padding: '20px', background: 'rgba(8, 9, 13, 0.4)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span className="eyebrow" style={{ color: 'var(--signal-bright)', fontSize: '9px', letterSpacing: '0.12em' }}>LIVE AGENT OBSERVATIONS</span>
          <h4 style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Playwright Execution Log</h4>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.6', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SIMULATION_STEPS.map((s, idx) => {
            const isCompleted = idx < stepIdx
            const isActive = idx === stepIdx
            return (
              <div 
                key={idx} 
                style={{ 
                  opacity: isActive ? 1 : isCompleted ? 0.6 : 0.2, 
                  color: isActive ? (s.error ? 'var(--danger)' : 'var(--signal-bright)') : isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)',
                  transition: 'opacity 0.3s ease, color 0.3s ease',
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <span>{isActive ? '●' : '✓'}</span>
                <span>{s.log}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Simulated Browser Frame */}
      <div 
        className="spotlight-card"
        style={{ 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          background: '#090a0f', 
          boxShadow: 'var(--shadow)',
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '1.35',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Browser Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '4px', fontSize: '9px', color: 'var(--text-muted)', padding: '3px 12px', marginLeft: '12px', flex: 1, fontFamily: 'monospace', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            http://localhost:5173/todos
          </div>
        </div>

        {/* Browser Content Area */}
        <div style={{ flex: 1, position: 'relative', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#08090c' }}>
          
          {/* Simulated Mouse Pointer */}
          <div 
            className="simulated-cursor" 
            style={{ 
              top: step.cursor.top, 
              left: step.cursor.left,
              transform: step.status === 'clicking' ? 'scale(0.85)' : 'none'
            }}
          >
            <MousePointer2 size={16} style={{ color: '#06b6d4', fill: '#06b6d4', transform: 'rotate(-20deg) translate(-2px, -2px)' }} />
            {step.status === 'clicking' && (
              <span className="ripple-circle" style={{ position: 'absolute', top: '-6px', left: '-6px', width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #06b6d4', pointerEvents: 'none' }} />
            )}
          </div>

          {/* Simulated DOM Highlights */}
          {step.highlight && (
            <div 
              className={`dom-glow-box ${step.highlight.isError ? 'error-focus' : ''}`}
              style={{
                top: step.highlight.top,
                left: step.highlight.left,
                width: step.highlight.width,
                height: step.highlight.height
              }}
            />
          )}

          {/* Simulated Target App Todo Interface */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)' }}>React + Vite Todo App</span>
              <span style={{ fontSize: '9px', background: step.error ? 'rgba(251, 113, 133, 0.1)' : 'rgba(110, 231, 183, 0.1)', color: step.error ? 'var(--danger)' : 'var(--success)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                {step.status.toUpperCase()}
              </span>
            </div>

            {/* Todo Input Field */}
            <input 
              readOnly 
              type="text" 
              placeholder="What needs to be done?" 
              value={step.inputText}
              style={{ 
                width: '100%', 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border)', 
                borderRadius: '6px', 
                padding: '6px 12px', 
                fontSize: '11px', 
                color: 'var(--text)',
                outline: 'none'
              }} 
            />

            {/* Todo List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {step.todos.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: t.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', padding: '4px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <input type="checkbox" readOnly checked={t.done} style={{ accentColor: 'var(--success)' }} />
                  <span>{t.text}</span>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', paddingTop: '4px' }}>
              <span>1 item left</span>
              <button 
                style={{ 
                  background: step.status === 'clicking' ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  color: 'var(--text-secondary)',
                  fontSize: '9px',
                  cursor: 'pointer'
                }}
              >
                Clear completed
              </button>
            </div>
          </div>

          {/* Validation Warning Alert Overlay */}
          {step.error && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 12px', border: '1px solid rgba(251, 113, 133, 0.35)', borderRadius: '6px', background: 'rgba(251, 113, 133, 0.08)', color: '#fb7185', fontSize: '10px', marginTop: 'auto' }}>
              <AlertCircle size={12} style={{ flexShrink: 0 }} />
              <span><strong>ASSERTION FAILED:</strong> "Clear completed" element not deleted from DOM. Stale state node mismatch.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene 03 — Deep Exploration Engine
// ---------------------------------------------------------------------------

const EXPLORATION_SEQUENCE = [
  {
    cursorTarget: { top: 18, left: 42 },
    elementLabel: '<h1>',
    elementType: 'Heading',
    classification: 'Navigation Anchor',
    confidence: 0.92,
    telemetry: 'Target loaded — scanning heading hierarchy',
    glowColor: '#06b6d4'
  },
  {
    cursorTarget: { top: 38, left: 25 },
    elementLabel: '<input>',
    elementType: 'Text Field',
    classification: 'User Input',
    confidence: 0.88,
    telemetry: 'Interactive input field detected — indexing form controls',
    glowColor: '#06b6d4'
  },
  {
    cursorTarget: { top: 52, left: 15 },
    elementLabel: '<li>',
    elementType: 'List Item',
    classification: 'Repeating Component',
    confidence: 0.95,
    telemetry: 'Repeating list structure identified — mapping child nodes',
    glowColor: '#3b82f6'
  },
  {
    cursorTarget: { top: 58, left: 12 },
    elementLabel: '<div role="checkbox">',
    elementType: 'Custom Control',
    classification: 'A11y Risk',
    confidence: 0.74,
    telemetry: 'WARNING: Non-native checkbox — missing ARIA role binding',
    glowColor: '#f59e0b'
  },
  {
    cursorTarget: { top: 75, left: 72 },
    elementLabel: '<button>',
    elementType: 'Action Trigger',
    classification: 'Dead Handler',
    confidence: 0.97,
    telemetry: 'CRITICAL: onClick handler missing — "Clear completed" is non-functional',
    glowColor: '#fb7185'
  },
  {
    cursorTarget: { top: 82, left: 50 },
    elementLabel: '<footer>',
    elementType: 'Layout Region',
    classification: 'Structural',
    confidence: 0.91,
    telemetry: 'Navigation graph complete — primary user journey identified',
    glowColor: '#10b981'
  }
]

function ExplorationDeepDive() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= EXPLORATION_SEQUENCE.length - 1) return

    const timer = window.setTimeout(() => {
      setStep(prev => (prev < EXPLORATION_SEQUENCE.length - 1 ? prev + 1 : prev))
    }, step === 0 ? 2200 : 2600)

    return () => window.clearTimeout(timer)
  }, [step])

  const current = EXPLORATION_SEQUENCE[step]
  const discoveredNodes = Array.from({ length: step }, (_, idx) => idx)
  const confidenceProgress = Math.round((discoveredNodes.length / EXPLORATION_SEQUENCE.length) * 100)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

      {/* Premium Browser Frame */}
      <div 
        className="spotlight-card animate-terminal-float"
        style={{ 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          background: '#090a0f', 
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(6, 182, 212, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Glass Reflection Sweep */}
        <div style={{ 
          position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%', 
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.015) 45%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.015) 55%, transparent 60%)', 
          transform: 'skewX(-15deg)',
          animation: 'sweep-reflection 8s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 50 
        }} />

        {/* Browser Chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', padding: '10px 16px', background: 'rgba(255,255,255,0.015)', flexShrink: 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '10px', color: 'var(--text-muted)', padding: '4px 16px', marginLeft: '12px', flex: 1, fontFamily: 'monospace', textAlign: 'center' }}>
            http://localhost:5173
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="pulse-dot" style={{ width: '5px', height: '5px' }} />
            <span style={{ fontSize: '9px', color: '#06b6d4', fontWeight: 700, letterSpacing: '0.06em' }}>EXPLORING</span>
          </div>
        </div>

        {/* Simulated Application Viewport */}
        <div style={{ position: 'relative', padding: '24px', minHeight: '340px', background: '#08090c' }}>

          {/* Simulated AI Cursor */}
          <div 
            className="simulated-cursor"
            style={{ 
              top: `${current.cursorTarget.top}%`, 
              left: `${current.cursorTarget.left}%`,
            }}
          >
            <MousePointer2 size={15} style={{ color: '#06b6d4', fill: 'rgba(6, 182, 212, 0.3)', transform: 'rotate(-20deg)' }} />
            {/* Element Classification Badge */}
            <div style={{ 
              position: 'absolute', top: '-28px', left: '18px', 
              background: 'rgba(8, 9, 13, 0.95)', border: `1px solid ${current.glowColor}40`,
              borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap',
              fontSize: '9px', fontWeight: 700, color: current.glowColor,
              boxShadow: `0 0 12px ${current.glowColor}20`,
              transition: 'all 0.4s ease'
            }}>
              {current.elementLabel} <span style={{ opacity: 0.6 }}>· {current.classification}</span>
            </div>
          </div>

          {/* DOM Discovery Glow Box at cursor */}
          <div 
            className={`dom-glow-box ${current.glowColor === '#fb7185' ? 'error-focus' : ''}`}
            style={{
              top: `${current.cursorTarget.top - 3}%`,
              left: `${current.cursorTarget.left - 5}%`,
              width: '180px',
              height: '32px',
              borderColor: current.glowColor,
              boxShadow: `0 0 16px ${current.glowColor}30`,
              transition: 'all 1s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
          />

          {/* Previously Discovered Nodes (soft residual glow) */}
          {discoveredNodes.map(nodeIdx => {
            const node = EXPLORATION_SEQUENCE[nodeIdx]
            if (nodeIdx === step) return null
            return (
              <div 
                key={nodeIdx}
                style={{
                  position: 'absolute',
                  top: `${node.cursorTarget.top - 2}%`,
                  left: `${node.cursorTarget.left - 4}%`,
                  width: '160px',
                  height: '28px',
                  border: `1px solid ${node.glowColor}15`,
                  borderRadius: '4px',
                  background: `${node.glowColor}04`,
                  pointerEvents: 'none',
                  transition: 'all 0.5s ease'
                }}
              />
            )
          })}

          {/* Simulated App Content */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '12px', color: 'var(--text)' }}>React Todo Application</strong>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>v2.1.0</span>
            </div>
            <input readOnly type="text" placeholder="What needs to be done?" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 12px', fontSize: '11px', color: 'var(--text)', outline: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { text: 'Fix stale closure in addTodo handler', done: true },
                { text: 'Add ARIA roles to custom checkboxes', done: false },
                { text: 'Wire onClick to "Clear completed" button', done: false },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: t.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <input type="checkbox" readOnly checked={t.done} style={{ accentColor: 'var(--success)' }} />
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span>2 items left</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>All</span>
                <span>Active</span>
                <span>Completed</span>
              </div>
              <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '2px 8px', color: 'var(--text-secondary)', fontSize: '9px', cursor: 'pointer' }}>
                Clear completed
              </button>
            </div>
          </div>

          {/* Scanning Wave Overlay */}
          <div className="scanner-line" style={{ opacity: 0.15 }} />
        </div>
      </div>

      {/* Live Telemetry Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Discovery Confidence Gauge */}
        <div className="panel-card" style={{ padding: '16px' }}>
          <span className="eyebrow" style={{ color: '#06b6d4', fontSize: '9px' }}>EXPLORATION CONFIDENCE</span>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ 
                width: `${confidenceProgress}%`, 
                height: '100%', 
                background: 'linear-gradient(to right, #06b6d4, #10b981)',
                borderRadius: '2px',
                transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
              }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#06b6d4' }}>
              {confidenceProgress}%
            </span>
          </div>
        </div>

        {/* Current Element Details */}
        <div className="panel-card" style={{ padding: '16px' }}>
          <span className="eyebrow" style={{ color: current.glowColor, fontSize: '9px' }}>INSPECTING ELEMENT</span>
          <div style={{ marginTop: '8px' }}>
            <code style={{ fontSize: '13px', color: current.glowColor, fontWeight: 700 }}>{current.elementLabel}</code>
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: `${current.glowColor}15`, color: current.glowColor, fontWeight: 700 }}>
                {current.elementType}
              </span>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: `${current.glowColor}10`, color: current.glowColor, fontWeight: 600 }}>
                {current.classification}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Confidence:</span>
              <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: current.confidence >= 0.9 ? '#10b981' : current.confidence >= 0.8 ? '#06b6d4' : '#f59e0b' }}>
                {(current.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Progressive Discovery Timeline */}
        <div className="panel-card" style={{ padding: '16px', flex: 1 }}>
          <span className="eyebrow" style={{ fontSize: '9px' }}>DISCOVERY TIMELINE</span>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {EXPLORATION_SEQUENCE.map((seq, idx) => {
              const isDiscovered = discoveredNodes.includes(idx)
              const isActive = idx === step
              return (
                <div key={idx} style={{ 
                  display: 'flex', gap: '8px', alignItems: 'flex-start', 
                  opacity: isActive ? 1 : isDiscovered ? 0.55 : 0.15,
                  transition: 'opacity 0.4s ease'
                }}>
                  <div style={{ 
                    width: '6px', height: '6px', borderRadius: '50%', marginTop: '4px', flexShrink: 0,
                    background: isActive ? seq.glowColor : isDiscovered ? `${seq.glowColor}80` : 'var(--border)',
                    boxShadow: isActive ? `0 0 8px ${seq.glowColor}60` : 'none',
                    transition: 'all 0.3s ease'
                  }} />
                  <span style={{ 
                    fontSize: '10px', lineHeight: '1.4',
                    color: isActive ? (seq.glowColor === '#fb7185' ? '#fb7185' : 'var(--text)') : 'var(--text-secondary)',
                    fontFamily: 'monospace'
                  }}>
                    {seq.telemetry}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

const UNDERSTANDING_NODES = [
  { id: 'journeys', label: 'User Journeys', category: 'Narrative', x: 18, y: 24, color: '#8b8cff' },
  { id: 'components', label: 'Components', category: 'UI atoms', x: 78, y: 24, color: '#06b6d4' },
  { id: 'routes', label: 'Routes', category: 'Entry points', x: 18, y: 54, color: '#3b82f6' },
  { id: 'state', label: 'State', category: 'Shared memory', x: 78, y: 54, color: '#f59e0b' },
  { id: 'api', label: 'API Calls', category: 'Runtime services', x: 24, y: 80, color: '#10b981' },
  { id: 'events', label: 'Events', category: 'Behavior hooks', x: 70, y: 78, color: '#34d399' },
  { id: 'runtime', label: 'Runtime Behavior', category: 'Observed outcomes', x: 48, y: 38, color: '#fb7185' },
  { id: 'shared', label: 'Shared Logic', category: 'Cross-cutting rules', x: 50, y: 68, color: '#b2b3ff' },
] as const

const UNDERSTANDING_LINKS = [
  { from: 'journeys', to: 'runtime' },
  { from: 'components', to: 'runtime' },
  { from: 'routes', to: 'runtime' },
  { from: 'components', to: 'state' },
  { from: 'state', to: 'shared' },
  { from: 'api', to: 'shared' },
  { from: 'events', to: 'runtime' },
  { from: 'journeys', to: 'events' },
] as const

const UNDERSTANDING_INSIGHTS = [
  {
    title: 'User Journey Confidence Rising',
    detail: 'The path from entry to completion now feels coherent and intentional.',
    focusNodes: ['journeys', 'runtime', 'events'],
  },
  {
    title: 'Shared Component Groups Detected',
    detail: 'Repeated UI patterns collapse into a reusable mental map.',
    focusNodes: ['components', 'shared', 'state'],
  },
  {
    title: 'Routes and State Dependencies Established',
    detail: 'Navigation choices and mutable state now connect as one system.',
    focusNodes: ['routes', 'state', 'shared'],
  },
  {
    title: 'Runtime Behavior Correlated',
    detail: 'Observed interactions align with source logic and API expectations.',
    focusNodes: ['runtime', 'api', 'events'],
  },
  {
    title: 'System Understanding Complete',
    detail: 'The model feels calm, organized, and ready to act with confidence.',
    focusNodes: UNDERSTANDING_NODES.map(node => node.id),
  },
] as const

function UnderstandingGraphScene() {
  const [phase, setPhase] = useState(0)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    if (phase >= UNDERSTANDING_INSIGHTS.length - 1) return

    const timer = window.setTimeout(() => {
      setPhase(prev => (prev < UNDERSTANDING_INSIGHTS.length - 1 ? prev + 1 : prev))
    }, 3200)

    return () => window.clearTimeout(timer)
  }, [phase])

  const insight = UNDERSTANDING_INSIGHTS[phase]
  const activeNodeIds = new Set(insight.focusNodes)
  const progress = ((phase + 1) / UNDERSTANDING_INSIGHTS.length) * 100
  const visibleNodeIds = new Set(insight.focusNodes)
  const visibleNodes = UNDERSTANDING_NODES.filter(node => visibleNodeIds.has(node.id))
  const visibleLinks = UNDERSTANDING_LINKS.filter(link => visibleNodeIds.has(link.from) && visibleNodeIds.has(link.to))
  const isComplete = phase === UNDERSTANDING_INSIGHTS.length - 1

  return (
    <div className="understanding-shell">
      <div className="understanding-stage">
        <div className="understanding-stage-glow" />
        <div className="understanding-grid-overlay" />

        <div
          className="understanding-browser"
          style={{
            opacity: Math.max(0.22, 1 - phase * 0.12),
            transform: `translateY(${phase * 3}px) scale(${1 - phase * 0.03})`,
          }}
        >
          <div className="understanding-browser-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="understanding-browser-body">
            <div className="understanding-browser-card">
              <strong>Todo App</strong>
              <p>Completed items no longer vanish from the active list.</p>
            </div>
            <div className="understanding-browser-row" />
            <div className="understanding-browser-row" />
            <div className="understanding-browser-row short" />
          </div>
        </div>

        <svg className="understanding-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {visibleLinks.map(link => {
            const fromNode = UNDERSTANDING_NODES.find(node => node.id === link.from)
            const toNode = UNDERSTANDING_NODES.find(node => node.id === link.to)
            if (!fromNode || !toNode) return null

            const isHighlighted = hoveredNode
              ? hoveredNode === link.from || hoveredNode === link.to || activeNodeIds.has(link.from) || activeNodeIds.has(link.to)
              : activeNodeIds.has(link.from) && activeNodeIds.has(link.to)

            return (
              <path
                key={`${link.from}-${link.to}`}
                d={`M ${fromNode.x} ${fromNode.y} C ${(fromNode.x + toNode.x) / 2} ${Math.min(fromNode.y, toNode.y) - 8}, ${(fromNode.x + toNode.x) / 2} ${Math.max(fromNode.y, toNode.y) + 8}, ${toNode.x} ${toNode.y}`}
                className={`understanding-link ${isHighlighted ? 'understanding-link-active' : 'understanding-link-muted'}`}
              />
            )
          })}
        </svg>

        {visibleNodes.map(node => {
          const isActive = activeNodeIds.has(node.id)
          const isRelated = hoveredNode ? hoveredNode === node.id || activeNodeIds.has(node.id) : isActive
          const isDimmed = hoveredNode ? !isRelated : false

          return (
            <button
              key={node.id}
              className={`understanding-node ${isActive ? 'understanding-node-active' : ''}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                borderColor: isActive ? `${node.color}66` : 'rgba(255,255,255,0.12)',
                opacity: isDimmed ? 0.34 : 1,
                boxShadow: isActive ? `0 0 24px ${node.color}18` : undefined,
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <span className="understanding-node-core" style={{ background: node.color }} />
              <span className="understanding-node-label">{node.label}</span>
              <small>{node.category}</small>
            </button>
          )
        })}

        {isComplete && (
          <div className="understanding-center" style={{ opacity: 1 }}>
            <span className="eyebrow" style={{ justifyContent: 'center', color: '#8b8cff' }}>AI MENTAL MODEL</span>
            <strong>The agent now understands the app</strong>
            <p>Observation has become meaning.</p>
          </div>
        )}
      </div>

      <div className="understanding-panel">
        <div className="understanding-panel-header">
          <span className="eyebrow" style={{ color: '#8b8cff' }}>SCENE 04 — UNDERSTANDING</span>
          <div className="understanding-confidence">
            <div className="understanding-confidence-bar">
              <div style={{ width: `${progress}%` }} />
            </div>
            <strong>{Math.round(progress)}%</strong>
          </div>
        </div>

        <div className="understanding-insight-card">
          <span className="eyebrow" style={{ color: '#b2b3ff' }}>LIVE DISCOVERY</span>
          <h3>{insight.title}</h3>
          <p>{insight.detail}</p>
        </div>

        <div className="understanding-insight-list">
          {UNDERSTANDING_INSIGHTS.slice(0, 3).map((item, index) => {
            const isActive = index === phase
            const isComplete = index < phase
            return (
              <div key={item.title} className={`understanding-insight-pill ${isActive ? 'active' : ''}`}>
                <span>{isComplete ? '✓' : isActive ? '●' : '○'}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const REASONING_STAGES = [
  { key: 'observe', label: 'Observe', title: 'Observed the mismatch', detail: 'The clear action fires, but completed todos remain visible.' },
  { key: 'correlate', label: 'Correlate', title: 'Correlated runtime evidence', detail: 'The interaction reaches the DOM without changing the list state.' },
  { key: 'infer', label: 'Infer', title: 'Inferring the cause', detail: 'The handler likely targets the wrong state path or stale reference.' },
  { key: 'validate', label: 'Validate', title: 'Validated against the app flow', detail: 'The event fires and the UI updates, but the data source does not.' },
  { key: 'prioritize', label: 'Prioritize', title: 'Prioritized the root cause', detail: 'The bug is now narrowed to the event binding and its state update.' },
  { key: 'decide', label: 'Decide', title: 'Identified the real issue', detail: 'The app is failing because the clear-completed action is wired to the wrong state path.' },
] as const

const REASONING_HYPOTHESES = [
  { title: 'State synchronization issue', detail: 'The UI state may be out of sync with the underlying todo list.', status: 'rejected' as const },
  { title: 'Rendering timing issue', detail: 'The list may be re-rendering after the update completes.', status: 'rejected' as const },
  { title: 'Event binding mismatch', detail: 'The clear action is linked to the wrong handler and stale state branch.', status: 'confirmed' as const },
]

function ReasoningEngineScene() {
  const [phase, setPhase] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    if (phase >= REASONING_STAGES.length - 1) return

    const timer = window.setTimeout(() => {
      setPhase(prev => (prev < REASONING_STAGES.length - 1 ? prev + 1 : prev))
    }, 3200)

    return () => window.clearTimeout(timer)
  }, [phase])

  const activeStage = REASONING_STAGES[phase]
  const activeHypothesis = REASONING_HYPOTHESES[Math.min(phase, REASONING_HYPOTHESES.length - 1)]
  const evidenceNodes = [
    { label: 'Observed DOM delta', x: 18, y: 22, tone: 'signal' },
    { label: 'State branch', x: 78, y: 24, tone: 'blue' },
    { label: 'Event pathway', x: 18, y: 74, tone: 'amber' },
    { label: 'Runtime confirmation', x: 78, y: 74, tone: 'success' },
  ]

  return (
    <div className="reasoning-shell">
      <div className="reasoning-stage">
        <div className="reasoning-stage-glow" />
        <div className="reasoning-grid" />

        <div className="reasoning-timeline" aria-label="Reasoning progression">
          {REASONING_STAGES.map((step, index) => {
            const isActive = index === phase
            const isComplete = index < phase
            return (
              <div key={step.key} className={`reasoning-step ${isActive ? 'active' : isComplete ? 'complete' : ''}`}>
                <span>{isComplete ? '✓' : index + 1}</span>
                <strong>{step.label}</strong>
              </div>
            )
          })}
        </div>

        <div className="reasoning-core">
          <div className="reasoning-orb">
            <span className="eyebrow" style={{ justifyContent: 'center', color: '#8b8cff' }}>INTERNAL REASONING</span>
            <strong>{activeStage.title}</strong>
            <p>{activeStage.detail}</p>
          </div>

          {evidenceNodes.map((node, index) => {
            const isHighlighted = index === phase % evidenceNodes.length
            return (
              <div
                key={node.label}
                className={`reasoning-node ${isHighlighted ? 'active' : ''}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span />
                {node.label}
              </div>
            )
          })}
        </div>
      </div>

      <div className="reasoning-panel">
        <div className="reasoning-panel-header">
          <span className="eyebrow" style={{ color: '#8b8cff' }}>SCENE 05 — REASONING</span>
          <div className="reasoning-confidence">
            <div className="reasoning-confidence-bar">
              <div style={{ width: `${((phase + 1) / REASONING_STAGES.length) * 100}%` }} />
            </div>
            <strong>{Math.round(((phase + 1) / REASONING_STAGES.length) * 100)}%</strong>
          </div>
        </div>

        <div className="reasoning-evidence-card">
          <span className="eyebrow" style={{ color: '#b2b3ff' }}>CURRENT BELIEF</span>
          <h3>{activeHypothesis.title}</h3>
          <p>{activeHypothesis.detail}</p>
        </div>

        <div className="reasoning-hypothesis-list">
          {REASONING_HYPOTHESES.map((item, index) => {
            const isActive = item.status === 'confirmed' || (hoveredCard === index) || (index === phase % REASONING_HYPOTHESES.length)
            const isConfirmed = item.status === 'confirmed'
            return (
              <button
                key={item.title}
                className={`reasoning-hypothesis ${isActive ? 'active' : ''} ${isConfirmed ? 'confirmed' : ''}`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <span>{isConfirmed ? '●' : '○'}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const MISSION_CHECKS = [
  { id: 'runtime', label: 'Runtime Stable', detail: 'The interaction completes without throwing.', tone: 'success' as const },
  { id: 'ui', label: 'UI Verified', detail: 'The list now reflects the intended state change.', tone: 'signal' as const },
  { id: 'console', label: 'Console Clean', detail: 'No new runtime warnings surfaced during verification.', tone: 'success' as const },
  { id: 'patch', label: 'Patch Applied', detail: 'The repaired logic is active in the target path.', tone: 'success' as const },
  { id: 'journey', label: 'Journey Successful', detail: 'The core task can now finish without friction.', tone: 'success' as const },
]

function MissionControlScene() {
  const activeCheck = MISSION_CHECKS[MISSION_CHECKS.length - 1]

  return (
    <div className="mission-shell">
      <div className="mission-stage">
        <div className="mission-stage-glow" />
        <div className="mission-grid" />

        <div className="mission-center-card">
          <div className="mission-ring" />
          <div className="mission-ring inner" />
          <div className="mission-center-core">
            <span className="eyebrow" style={{ justifyContent: 'center', color: '#8b8cff' }}>MISSION CONTROL</span>
            <strong>Repair confirmed</strong>
            <p>The AI has proved the fix worked and the experience is now stable.</p>
          </div>
        </div>

        {MISSION_CHECKS.map((check, index) => {
          const positions = [
            { left: '24%', top: '34%' },
            { left: '76%', top: '34%' },
            { left: '24%', top: '70%' },
            { left: '76%', top: '70%' },
          ]
          const position = positions[index % positions.length]
          return (
            <div key={check.id} className="mission-check complete" style={{ left: position.left, top: position.top }}>
              <span />
              <strong>{check.label}</strong>
              <small>{check.detail}</small>
            </div>
          )
        })}
      </div>

      <div className="mission-panel">
        <div className="mission-panel-header">
          <span className="eyebrow" style={{ color: '#8b8cff' }}>SCENE 07 — MISSION CONTROL</span>
          <div className="mission-status-pill">
            <span className="mission-status-dot" />
            <strong>READY</strong>
          </div>
        </div>

        <div className="mission-evidence-card">
          <span className="eyebrow" style={{ color: '#b2b3ff' }}>CURRENT VERIFICATION</span>
          <h3>{activeCheck.label}</h3>
          <p>{activeCheck.detail}</p>
        </div>

        <div className="mission-log-list">
          {MISSION_CHECKS.map(check => (
            <div key={check.id} className="mission-log-item">
              <span>✓</span>
              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mission-cta-row">
          <button className="primary-button" style={{ padding: '10px 16px', fontSize: '12px' }} onClick={() => navigateToRun(demoRun.id)}>
            Review the run
          </button>
        </div>
      </div>
    </div>
  )
}

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  return scrollY
}
function useMagneticButton() {
  const ref = useRef<HTMLButtonElement>(null)
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      btn.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`
    }
  }
  const handleMouseLeave = () => {
    const btn = ref.current
    if (btn) {
      btn.style.transform = 'none'
    }
  }
  return { ref, handleMouseMove, handleMouseLeave }
}

const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = ((centerY - y) / centerY) * 6
  const rotateY = ((x - centerX) / centerX) * 6
  el.style.setProperty('--rot-x', `${rotateX}deg`)
  el.style.setProperty('--rot-y', `${rotateY}deg`)
}

const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.currentTarget
  el.style.setProperty('--rot-x', '0deg')
  el.style.setProperty('--rot-y', '0deg')
}

function ScrollRevealContainer({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

    if (ref.current) {
      observer.observe(ref.current)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <div 
      ref={ref} 
      className={`scroll-reveal ${isVisible ? 'is-visible' : ''}`}
      style={style}
    >
      {children}
    </div>
  )
}

export function LandingPage() {
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const scrollY = useScrollPosition()
  const primaryCTA = useMagneticButton()
  const secondaryCTA = useMagneticButton()



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
          
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Tag / Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', border: '1px solid rgba(139, 140, 255, 0.15)', borderRadius: '999px', background: 'var(--signal-soft)', width: 'fit-content' }}>
              <span className="pulse-dot" />
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--signal-bright)' }}>
                Autonomous Quality Agent
              </span>
            </div>

            {/* High-Impact Heading */}
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 62px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', margin: 0, textWrap: 'balance' }}>
              Your frontend broke.<br />
              <span style={{ color: 'var(--signal-bright)' }}>
                Watch AI fix it.
              </span>
            </h1>

            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: '520px' }}>
              FrontendPilot AI is an autonomous agent that runs target apps in Playwright, maps runtime errors to JSX nodes via AST, and applies verified, regression-free patches.
            </p>

            {/* Curated Incident Stakes Card */}
            <div className="spotlight-card tilt-card" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.01)', maxWidth: '520px', overflow: 'hidden' }}>
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
                ref={primaryCTA.ref}
                onMouseMove={primaryCTA.handleMouseMove}
                onMouseLeave={primaryCTA.handleMouseLeave}
                className="primary-button magnetic-cta" 
                onClick={() => navigateToRun(demoRun.id)}
                style={{ fontSize: '13px', padding: '12px 20px', willChange: 'transform' }}
              >
                Explore Demo Run <ArrowRight size={16} />
              </button>
              
              <button
                ref={secondaryCTA.ref}
                onMouseMove={secondaryCTA.handleMouseMove}
                onMouseLeave={secondaryCTA.handleMouseLeave}
                className="primary-button magnetic-cta"
                onClick={handleStartRealRun}
                disabled={starting}
                style={{ 
                  background: 'transparent', 
                  color: 'var(--signal-bright)', 
                  borderColor: 'var(--signal)',
                  fontSize: '13px',
                  padding: '12px 20px',
                  willChange: 'transform'
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
          <div className="animate-fade-in-up" style={{ position: 'relative', width: '100%', maxWidth: '520px', justifySelf: 'center', animationDelay: '0.15s', opacity: 0, transform: `translateY(${scrollY * 0.08}px)`, transition: 'transform 0.1s ease-out' }}>
            {/* Ambient backing light shape */}
            <div className="ambient-light" style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) translateY(${scrollY * 0.03}px)`, width: '420px', height: '420px', pointerEvents: 'none', zIndex: 0 }} />
            
            <div className="animate-terminal-float">
              <div className="hero-orbit spotlight-card tilt-card" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave} style={{ position: 'relative', zIndex: 1, padding: '16px', background: '#090a0f', minHeight: 'auto', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                
                {/* Fake IDE Header / App Window */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '14px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '8px', fontFamily: 'monospace' }}>frontendpilot-agent.log</span>
                </div>
                <TypewriterTerminal />

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

          </div>

        </section>

        {/* Scene 02 — The AI Awakens: Live Agent Explorer Simulator */}
        <ScrollRevealContainer>
          <section className="scene-section">
            <div className="scene-intro" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
              <span className="eyebrow scene-eyebrow" style={{ color: 'var(--signal-bright)' }}>SCENE 02 — THE AI AWAKENS</span>
              <h2 className="scene-title">
                Watch the Agent Explore & Detect Node Failures
              </h2>
              <p className="scene-copy">
                FrontendPilot spawns a headless browser sandbox, tracks DOM coordinate locations, and drives simulated mouse cursor movements to inspect elements.
              </p>
            </div>
            <SimulatedExplorerBrowser />
          </section>
        </ScrollRevealContainer>

        {/* Scene 03 — Exploration: Deep Autonomous Discovery */}
        <ScrollRevealContainer>
          <section className="scene-section">
            <div className="scene-intro" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
              <span className="eyebrow scene-eyebrow" style={{ color: '#06b6d4' }}>SCENE 03 — AUTONOMOUS EXPLORATION</span>
              <h2 className="scene-title">
                The AI Builds an Internal Model of Your Application
              </h2>
              <p className="scene-copy">
                Explorer autonomously traverses the DOM tree, classifies interactive elements, identifies accessibility risks, and discovers dead event handlers — all without human guidance.
              </p>
            </div>
            <ExplorationDeepDive />
          </section>
        </ScrollRevealContainer>

        {/* Scene 04 — Understanding: The AI Forms a Mental Model */}
        <ScrollRevealContainer>
          <section className="scene-section">
            <div className="scene-intro" style={{ maxWidth: '720px', alignItems: 'flex-start', textAlign: 'left' }}>
              <span className="eyebrow scene-eyebrow" style={{ color: '#8b8cff' }}>SCENE 04 — UNDERSTANDING</span>
              <h2 className="scene-title">
                The AI compresses scattered observations into a coherent mental model
              </h2>
              <p className="scene-copy">
                Explorer’s evidence becomes routes, state, behaviors, and shared logic — not as a list of files, but as a living understanding of the application.
              </p>
            </div>
            <UnderstandingGraphScene />
          </section>
        </ScrollRevealContainer>

        {/* Scene 05 — Reasoning: The AI Identifies the Real Problem */}
        <ScrollRevealContainer>
          <section className="scene-section">
            <div className="scene-intro" style={{ maxWidth: '720px', alignItems: 'flex-start', textAlign: 'left' }}>
              <span className="eyebrow scene-eyebrow" style={{ color: '#8b8cff' }}>SCENE 05 — REASONING</span>
              <h2 className="scene-title">
                The AI narrows the problem until only one explanation remains
              </h2>
              <p className="scene-copy">
                What once felt like scattered evidence becomes a focused internal explanation: the clear-completed action is bound to the wrong path.
              </p>
            </div>
            <ReasoningEngineScene />
          </section>
        </ScrollRevealContainer>

        {/* Scene 07 — Mission Control: Trust and Proof */}
        <ScrollRevealContainer>
          <section className="scene-section">
            <div className="scene-intro" style={{ maxWidth: '720px', alignItems: 'flex-start', textAlign: 'left' }}>
              <span className="eyebrow scene-eyebrow" style={{ color: '#8b8cff' }}>SCENE 07 — MISSION CONTROL</span>
              <h2 className="scene-title">
                The AI proves the repair worked and the system is ready
              </h2>
              <p className="scene-copy">
                Verification becomes confidence. The experience settles into calm evidence, clear trust, and a professional finish.
              </p>
            </div>
            <MissionControlScene />
          </section>
        </ScrollRevealContainer>

        {/* Pipeline Process Strip (PRIORITY 3: Clear 5-second visualization) */}
        <ScrollRevealContainer>
          <section style={{ marginBottom: '80px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '32px' }}>
              THE AUTONOMOUS EXECUTION LOOP
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              
              <div className="panel-card spotlight-card tilt-card" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'grid', placeItems: 'center' }}>
                  <Compass size={18} />
                </div>
                <strong style={{ fontSize: '14px', color: 'var(--text)' }}>1. Explorer</strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Runs target app via Playwright, replicates journeys, and captures DOM elements.
                </p>
              </div>

              <div className="panel-card spotlight-card tilt-card" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'grid', placeItems: 'center' }}>
                  <FileSearch size={18} />
                </div>
                <strong style={{ fontSize: '14px', color: 'var(--text)' }}>2. Source Mapper</strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  AST parser traverses workspace source files to identify buggy code candidates.
                </p>
              </div>

              <div className="panel-card spotlight-card tilt-card" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'grid', placeItems: 'center' }}>
                  <BrainCircuit size={18} />
                </div>
                <strong style={{ fontSize: '14px', color: 'var(--text)' }}>3. Analyzer</strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Correlates data logs and constructs root cause hypotheses using OpenAI models.
                </p>
              </div>

              <div className="panel-card spotlight-card tilt-card" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'grid', placeItems: 'center' }}>
                  <Wrench size={18} />
                </div>
                <strong style={{ fontSize: '14px', color: 'var(--text)' }}>4. Repair Agent</strong>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Synthesizes surgical search/replace patches verified against static syntaxes.
                </p>
              </div>

              <div className="panel-card spotlight-card tilt-card" onMouseMove={handleCardMouseMove} onMouseLeave={handleCardMouseLeave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
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
        </ScrollRevealContainer>

        {/* Feature Highlights Grid */}
        <ScrollRevealContainer>
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
        </ScrollRevealContainer>

      </main>
    </AppShell>
  )
}
