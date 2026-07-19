import { ChevronRight, ExternalLink, FileWarning, Radio } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { AppShell } from "../../components/chrome/AppShell";
import { StageRail } from "../../components/chrome/StageRail";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { demoRun } from "../../fixtures/demoRun";
import { stageColors } from "../../types/pipeline";
import {
  ExplorerVisualizer,
  SourceMapperVisualizer,
  AnalyzerVisualizer,
  RepairVisualizer,
  VerifierVisualizer,
} from "../../components/run/StageVisualizers";
import {
  handleCardMouseMove,
  handleCardMouseLeave,
  MobilePipeline,
} from "../../components/run/SharedRunUtils";

// ---------------------------------------------------------------------------
// Demo mode: deterministic auto-advance through stages
// Each "tick" advances one stage to completion
// ---------------------------------------------------------------------------

type DemoState = "idle" | "running" | "success" | "failed";

const STAGE_ORDER = ["explorer", "mapper", "analyzer", "repair", "verifier"];

const STAGE_DURATIONS: Record<string, number> = {
  explorer: 4000,  // 4s
  mapper: 2000,    // 2s
  analyzer: 5000,  // 5s
  repair: 3500,    // 3.5s
  verifier: 4500,  // 4.5s
};

// Total: ~19s per stage = ~95s for all 5 stages (within 60-90 target for replay,
// but fast enough for demo — each stage enters "complete" then moves on)
// Using 1/2 speed for readable presentation: ~45s total

export function RunDashboardPage() {
  const [demoState, setDemoState] = useState<DemoState>("running");
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [currentPipelineStage, setCurrentPipelineStage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef(true);

  // Deterministic auto-advance: each stage completes in sequence
  const advancePipeline = useCallback(() => {
    if (currentPipelineStage >= STAGE_ORDER.length) {
      // All stages complete — move to success state
      setDemoState("success");
      return;
    }

    const stageId = STAGE_ORDER[currentPipelineStage];
    setCompletedStages(prev => new Set(prev).add(stageId));

    // Focus the newly completed stage
    setSelectedStageId(stageId);

    const nextStage = currentPipelineStage + 1;
    setCurrentPipelineStage(nextStage);

    // Schedule next stage
    if (nextStage < STAGE_ORDER.length) {
      const nextId = STAGE_ORDER[nextStage];
      const delay = STAGE_DURATIONS[nextId] || 3000;
      timerRef.current = setTimeout(advancePipeline, delay);
    } else {
      // All done
      timerRef.current = setTimeout(() => setDemoState("success"), 1500);
    }
  }, [currentPipelineStage]);

  // Start auto-advance on mount
  useEffect(() => {
    if (!autoRef.current) return;
    // Start with explorer immediately
    const startDelay = 500;
    timerRef.current = setTimeout(advancePipeline, startDelay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [advancePipeline]);

  // Build stage statuses deterministically
  const currentRun = {
    ...demoRun,
    status: (demoState === "running" ? "Running" : demoState === "success" ? "Success" : "Failed") as "Running" | "Success" | "Failed",
    stages: demoRun.stages.map((stage) => {
      if (completedStages.has(stage.id)) return { ...stage, status: "complete" as const };
      if (stage.id === STAGE_ORDER[currentPipelineStage] && demoState === "running") {
        return { ...stage, status: "running" as const };
      }
      return { ...stage, status: "queued" as const };
    }),
  };

  const activeStage =
    currentRun.stages.find((s) => s.status === "running") ??
    currentRun.stages.find((s) => s.status === "complete" && s.id === selectedStageId) ??
    currentRun.stages[currentRun.stages.length - 1];
  const currentStageId = selectedStageId || activeStage.id;
  const displayedStage =
    currentRun.stages.find((s) => s.id === currentStageId) || activeStage;

  // Mock snapshots representing the Todo App Clear completed bug lifecycle
  const mockSnapshot = {
    explorer_snapshot: {
      page_summary: {
        title: "Todo App",
        current_url: "http://localhost:5173",
        total_interactive_elements: 14,
        button_count: 3,
        input_count: 1,
      },
      runtime_evidence: {
        expected_interaction:
          "Add a new todo, complete it, and click 'Clear completed' button.",
        observed_dom_change:
          "The completed todo item was not cleared from the DOM, and remained in the list view.",
        observed_visual_change:
          "Visual line-through state was preserved, but item list height did not adjust.",
        observed_element_state:
          "'Clear completed' control is active and was clicked, but has no attached event listeners.",
      },
      console_events: [
        { severity: "info", message: "Vite HMR connected" },
        { severity: "info", message: "Todo initialized with 3 default items" },
      ],
      network_failures: [],
      navigation_flow: [
        { action: "navigate", selector: "http://localhost:5173" },
        { action: "fill", selector: "input[placeholder='Add a new todo']", value: "Buy groceries" },
        { action: "click", selector: "button:has-text('Add')" },
        { action: "click", selector: ".todo-item:first-child input[type='checkbox']" },
        { action: "click", selector: "button:has-text('Clear completed')" },
      ],
      screenshots: [
        { name: "before", path: "/api/artifacts/before.png" },
      ],
      severity: "high",
      confidence: "High",
      reported_issue: "\"Clear completed\" does nothing — completed todos remain visible after clicking.",
    },
    source_snapshot: {
      target_observation: "Clear completed button element",
      ast_query: "(jsx_opening_element (tag_name) (attribute (property_identifier) @attr (#eq? @attr \"onClick\")))",
      candidate_files: [
        {
          file_path: "target-app/src/App.tsx",
          heuristic_confidence: 0.9,
          match_reason: "File contains JSX button element with text content matching 'Clear completed'",
          components: [
            {
              component_name: "App",
              heuristic_confidence: 0.9,
              matching_nodes: [
                {
                  node_type: "jsx_element",
                  line_start: 104,
                  line_end: 108,
                  match_reason:
                    "Matches text 'Clear completed' inside button element without onClick attribute",
                  heuristic_confidence: 0.9,
                  snippet: `<button className="hover:underline hover:text-gray-800 transition-colors">\n  Clear completed\n</button>`,
                },
              ],
            },
          ],
        },
      ],
    },
    analysis_snapshot: {
      conclusion: {
        root_cause:
          "Missing onClick handler on the 'Clear completed' button component.",
        confidence_rationale:
          "AST traversal identifies the JSX button with text matching the interaction target. The parser confirms it lacks any event bindings, causing action dispatch to default to a no-op.",
        investigation_confidence: "High",
      },
      competing_hypotheses: [
        {
          hypothesis: "No onClick event handler assigned to button element.",
          plausibility_score: "High",
          supporting_evidence: [
            "JSX AST matches target label and is missing handler attributes",
          ],
        },
        {
          hypothesis: "State mutation code inside App component is faulty.",
          plausibility_score: "Medium",
          supporting_evidence: [
            "State list is maintained via React useState hooks",
          ],
        },
      ],
      repair_context: {
        repair_objectives: [
          "Bind click listener to the Clear completed button element.",
          "Invoke filtering logic on click to purge completed items from state.",
        ],
      },
    },
    repair_snapshot: {
      target_file: "target-app/src/App.tsx",
      commit_message: `fix: bind onClick handler to "Clear completed" button\n\nThe button was rendered without an event handler, causing the click\nto silently no-op. This patch wires the handleClearCompleted\nfunction to the onClick prop.`,
      modification_summary: "Binds onClick={handleClearCompleted} to the existing button element. The handler filters completed todos from state on click.",
      patch_explanation:
        "Binds the Clear completed button onClick handler to trigger handleClearCompleted state filtering.",
      repair_confidence: "High",
      diff: [
        {
          search_block: `<button className="hover:underline hover:text-gray-800 transition-colors">\n  Clear completed\n</button>`,
          replace_block: `<button\n  onClick={handleClearCompleted}\n  className="hover:underline hover:text-gray-800 transition-colors"\n>\n  Clear completed\n</button>`,
          removed_lines: 3,
          added_lines: 5,
          search_start_line: 104,
          replace_start_line: 104,
          change_reason: "add onClick handler",
        },
      ],
      repair_risks: [
        "Low risk. Purely binds local event listener to filter existing state array.",
      ],
    },
    verification_snapshot: {
      verification_status:
        demoState === "success"
          ? "Passed"
          : "Running",
      pass_fail_reason:
        demoState === "success"
          ? "2/2 assertions passed. The completed todo is removed from the DOM after clicking 'Clear completed'."
          : "Running 2 Playwright assertions...",
      rollback_required: false,
      previous_behavior:
        "Clicking 'Clear completed' preserved completed todos in the DOM. List height did not adjust. No console errors.",
      current_behavior:
        "Clicking 'Clear completed' removes all completed todos from the list. List height recalculates. No regressions.",
      accessibility_status: { violations: 0, passed: 12 },
      runtime_assertions: [
        { message: "DOM mutation observed on Clear completed click", passed: true },
        { message: "Completed todo removed from list", passed: true },
      ],
      console_assertions: [
        { message: "No new console errors introduced", passed: true },
      ],
      executed_steps: [
        { action: "click", selector: "button:has-text('Clear completed')" },
        { action: "assert_not_visible", selector: ".todo-item.completed" },
      ],
      regressions_detected: [],
      screenshots: [
        { name: "after_patch", path: "/api/artifacts/after.png" },
      ],
    },
  };

  return (
    <AppShell showBack>
      <main className="dashboard-page">
        <StageRail
          stages={currentRun.stages}
          selectedStageId={currentStageId}
          onSelectStage={setSelectedStageId}
        />

        <section
          className="workspace"
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          {/* Breadcrumb Detail row */}
          <div
            className="run-breadcrumb"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Runs</span>
              <ChevronRight size={12} />
              <strong>{currentRun.id}</strong>
              <span
                className="demo-chip"
                style={{
                  border: "1px solid rgba(110,231,183,.2)",
                  color: "var(--success)",
                  background: "rgba(110,231,183,.08)",
                }}
              >
                Demo Sandbox
              </span>
            </div>

            <div
              className="demo-controls"
              style={{
                display: "flex",
                gap: "8px",
                background: "var(--surface-muted)",
                padding: "4px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  color: "var(--text-muted)",
                  padding: "4px 6px",
                  fontWeight: 700,
                }}
              >
                {completedStages.size}/{STAGE_ORDER.length} stages
              </span>
            </div>
          </div>

          {/* LARGE MISSION CONTROL HERO HEADER */}
          <header
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: "20px",
            }}
          >
            <span
              className="eyebrow"
              style={{
                color: "var(--text-muted)",
                fontSize: "10px",
                letterSpacing: "0.08em",
                marginBottom: "6px",
              }}
            >
              AUTONOMOUS AGENT INVESTIGATION
            </span>
            <h1
              style={{
                fontSize: "clamp(24px, 4vw, 36px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                margin: "0 0 10px 0",
                lineHeight: 1.15,
                textWrap: "balance",
              }}
            >
              {demoState === "success"
                ? "Fix confirmed: 'Clear completed' now works correctly"
                : currentRun.issue}
            </h1>

            {/* Target App Server info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              <span>
                Target App:{" "}
                <strong style={{ color: "var(--text)" }}>
                  {currentRun.targetName}
                </strong>
              </span>
              <span style={{ color: "var(--border)" }}>|</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <ExternalLink size={12} /> URL:{" "}
                <code>{currentRun.targetUrl}</code>
              </span>
            </div>
          </header>

          {/* Mobile progress rail */}
          <MobilePipeline
            stages={currentRun.stages}
            selectedStageId={currentStageId}
            onSelectStage={setSelectedStageId}
          />

          {/* Primary Split View: Visual Evidence Focus on the Left, Side Stack on Right */}
          <section
            className="dashboard-content"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.6fr)",
              gap: "20px",
            }}
          >
            {/* Focus Panel */}
            <article
              className="focus-panel"
              style={{
                padding: "24px",
                minHeight: "420px",
                border: `1px solid ${stageColors[displayedStage.id]}33`,
              }}
            >
              <div
                className="panel-heading"
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    className="eyebrow"
                    style={{ color: stageColors[displayedStage.id] }}
                  >
                    <Radio
                      size={13}
                      className={
                        displayedStage.status === "running"
                          ? "pulsing-icon"
                          : ""
                      }
                    />
                    {displayedStage.status === "running"
                      ? "CURRENT PIPELINE STAGE"
                      : "STAGE SNAPSHOT EVIDENCE"}
                  </p>
                  <h2
                    style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      margin: "4px 0 0 0",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {displayedStage.name}
                  </h2>
                </div>
                <StatusBadge status={displayedStage.status} />
              </div>

              {/* Progressive Data Canvas */}
              <div
                key={currentStageId}
                className="animate-fade-in-up"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {displayedStage.id === "explorer" && (
                  <ExplorerVisualizer data={
                    completedStages.has("explorer") ? mockSnapshot.explorer_snapshot : null
                  } />
                )}
                {displayedStage.id === "mapper" && (
                  <SourceMapperVisualizer data={
                    completedStages.has("mapper") ? mockSnapshot.source_snapshot : null
                  } />
                )}
                {displayedStage.id === "analyzer" && (
                  <AnalyzerVisualizer data={
                    completedStages.has("analyzer") ? mockSnapshot.analysis_snapshot : null
                  } />
                )}
                {displayedStage.id === "repair" && (
                  <RepairVisualizer
                    data={
                      completedStages.has("repair") ? mockSnapshot.repair_snapshot : null
                    }
                  />
                )}
                {displayedStage.id === "verifier" && (
                  <VerifierVisualizer
                    data={
                      completedStages.has("verifier") ? mockSnapshot.verification_snapshot : null
                    }
                  />
                )}
              </div>
            </article>

            {/* Metrics & Logs Column */}
            <aside
              className="side-stack"
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Metrics */}
              <article
                className="panel-card spotlight-card tilt-card"
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                style={{ padding: "16px", overflow: "hidden" }}
              >
                <span className="eyebrow" style={{ marginBottom: "10px" }}>
                  PIPELINE SPEED
                </span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {currentRun.stages.map((st) => {
                    const isActive = st.id === currentStageId;
                    const color = stageColors[st.id];
                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStageId(st.id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          cursor: "pointer",
                          background: isActive ? `${color}11` : "transparent",
                          border: isActive
                            ? `1px solid ${color}33`
                            : "1px solid transparent",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            color: isActive
                              ? "var(--text)"
                              : "var(--text-secondary)",
                            fontWeight: isActive ? 700 : 500,
                          }}
                        >
                          {st.name}
                        </span>
                        <code
                          style={{
                            color:
                              st.duration !== "—" ? color : "var(--text-muted)",
                          }}
                        >
                          {st.duration}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </article>

              {/* Timeline event log */}
              <article
                className="panel-card spotlight-card tilt-card"
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                style={{
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  overflow: "hidden",
                }}
              >
                <div className="panel-heading" style={{ marginBottom: "12px" }}>
                  <div>
                    <p className="eyebrow">AGENT ACTIVITY TRACE</p>
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        margin: "2px 0 0 0",
                      }}
                    >
                      Workspace Log
                    </h3>
                  </div>
                  <FileWarning
                    size={15}
                    style={{ color: "var(--text-muted)" }}
                  />
                </div>

                <ol
                  className="event-list"
                  style={{
                    margin: 0,
                    overflowY: "auto",
                    maxHeight: "240px",
                    flex: 1,
                  }}
                >
                  {currentRun.stages.map((s, i) => (
                    <li
                      key={s.id}
                      style={{
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 0",
                      }}
                    >
                      <span
                        className={`event-dot ${s.status === "running" ? "running pulse" : s.status === "complete" ? "complete" : "queued"}`}
                      />
                      <span
                        style={{
                          flex: 1,
                          color: "var(--text-secondary)",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name} {s.status === "complete" ? "complete" : s.status === "running" ? "in progress" : "queued"}
                      </span>
                      <time
                        style={{ fontSize: "9px", color: "var(--text-muted)" }}
                      >
                        0{i + 1}
                      </time>
                    </li>
                  ))}
                </ol>
              </article>
            </aside>
          </section>
        </section>
      </main>
    </AppShell>
  );
}