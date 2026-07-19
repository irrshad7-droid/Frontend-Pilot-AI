import { ChevronRight, ExternalLink, FileWarning, Radio } from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell } from "../../components/chrome/AppShell";
import { StageRail } from "../../components/chrome/StageRail";
import { StatusBadge } from "../../components/data-display/StatusBadge";
import { demoRun } from "../../fixtures/demoRun";
import type { PipelineStage } from "../../types/pipeline";
import { stageColors } from "../../types/pipeline";
import {
  ExplorerVisualizer,
  SourceMapperVisualizer,
  AnalyzerVisualizer,
  RepairVisualizer,
  VerifierVisualizer,
} from "../../components/run/StageVisualizers";
const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = ((centerY - y) / centerY) * 4;
  const rotateY = ((x - centerX) / centerX) * 4;
  el.style.setProperty("--rot-x", `${rotateX}deg`);
  el.style.setProperty("--rot-y", `${rotateY}deg`);
};

const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.currentTarget;
  el.style.setProperty("--rot-x", "0deg");
  el.style.setProperty("--rot-y", "0deg");
};

function MobilePipeline({
  stages,
  selectedStageId,
  onSelectStage,
}: {
  stages: PipelineStage[];
  selectedStageId: string;
  onSelectStage: (id: string) => void;
}) {
  return (
    <nav
      className="mobile-pipeline"
      aria-label="Pipeline stages"
      style={{ padding: "8px", gap: "8px" }}
    >
      {stages.map((stage, index) => {
        const isSelected = stage.id === selectedStageId;
        const activeColor = stageColors[stage.id];
        return (
          <button
            type="button"
            className={`mobile-stage mobile-stage-${stage.status}`}
            key={stage.id}
            onClick={() => onSelectStage(stage.id)}
            aria-pressed={isSelected}
            aria-label={`${stage.name} stage`}
            style={{
              cursor: "pointer",
              border: isSelected
                ? `1px solid ${activeColor}`
                : "1px solid var(--border)",
              background: isSelected ? `${activeColor}15` : "transparent",
              padding: "6px 8px",
              borderRadius: "6px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: "9px",
                color: isSelected ? activeColor : "var(--text-muted)",
              }}
            >
              0{index + 1}
            </span>
            <strong
              style={{
                fontSize: "10px",
                color: isSelected ? "var(--text)" : "var(--text-secondary)",
              }}
            >
              {stage.name}
            </strong>
          </button>
        );
      })}
    </nav>
  );
}

export function RunDashboardPage() {
  const [demoState, setDemoState] = useState<
    "Running" | "Verified" | "Rolled back"
  >("Running");
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  const mappedStatus =
    demoState === "Running"
      ? "Running"
      : demoState === "Verified"
        ? "Success"
        : "Failed";

  const currentRun = {
    ...demoRun,
    status: mappedStatus as "Running" | "Success" | "Failed",
    stages: demoRun.stages.map((stage) => {
      if (demoState === "Verified")
        return { ...stage, status: "complete" as const };
      if (demoState === "Rolled back") {
        if (stage.id === "verifier")
          return { ...stage, status: "failed" as const };
        if (stage.id === "repair" || stage.id === "analyzer")
          return { ...stage, status: "complete" as const };
      }
      return stage;
    }),
  };

  const activeStage =
    currentRun.stages.find((stage) => stage.status === "running") ??
    currentRun.stages[currentRun.stages.length - 1];
  const currentStageId = selectedStageId || activeStage.id;
  const displayedStage =
    currentRun.stages.find((s) => s.id === currentStageId) || activeStage;

  // Sync selected stage if active stage changes and user has not interacted
  useEffect(() => {
    if (!selectedStageId) {
      setSelectedStageId(activeStage.id);
    }
  }, [activeStage.id, selectedStageId]);

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
      screenshots: [
        { name: "before", path: "/api/artifacts/before.png" },
        { name: "after", path: "/api/artifacts/after.png" },
      ],
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
      patch_explanation:
        "Binds the Clear completed button onClick handler to trigger handleClearCompleted state filtering.",
      repair_confidence: "High",
      diff: [
        {
          search_block: `<button className="hover:underline hover:text-gray-800 transition-colors">\n  Clear completed\n</button>`,
          replace_block: `<button \n  onClick={handleClearCompleted}\n  className="hover:underline hover:text-gray-800 transition-colors"\n>\n  Clear completed\n</button>`,
        },
      ],
      repair_risks: [
        "Low risk. Purely binds local event listener to filter existing state array.",
      ],
    },
    verification_snapshot: {
      verification_status:
        demoState === "Verified"
          ? "Passed"
          : demoState === "Rolled back"
            ? "Failed"
            : "Inconclusive",
      pass_fail_reason:
        demoState === "Verified"
          ? "All verification assertions passed. Todo item was purged and list height recalculated."
          : demoState === "Rolled back"
            ? "Verification failed: assertion timeout on todo list purge."
            : "Verification pending.",
      rollback_required: demoState === "Rolled back",
      executed_steps: [
        { action: "click", selector: "button:has-text('Clear completed')" },
        { action: "assert_not_visible", selector: ".todo-item.completed" },
      ],
      regressions_detected:
        demoState === "Rolled back"
          ? ["Verification assertion timeout on todo list purge."]
          : [],
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
              <button
                onClick={() => setDemoState("Running")}
                className={demoState === "Running" ? "demo-active" : ""}
                style={{
                  fontSize: "10px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color:
                    demoState === "Running" ? "var(--bg)" : "var(--text-muted)",
                  background:
                    demoState === "Running"
                      ? "var(--signal-bright)"
                      : "transparent",
                  fontWeight: 700,
                }}
              >
                Running
              </button>
              <button
                onClick={() => setDemoState("Verified")}
                className={demoState === "Verified" ? "demo-active" : ""}
                style={{
                  fontSize: "10px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color:
                    demoState === "Verified"
                      ? "var(--bg)"
                      : "var(--text-muted)",
                  background:
                    demoState === "Verified" ? "var(--success)" : "transparent",
                  fontWeight: 700,
                }}
              >
                Verified
              </button>
              <button
                onClick={() => setDemoState("Rolled back")}
                className={demoState === "Rolled back" ? "demo-active" : ""}
                style={{
                  fontSize: "10px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  color:
                    demoState === "Rolled back"
                      ? "var(--bg)"
                      : "var(--text-muted)",
                  background:
                    demoState === "Rolled back"
                      ? "var(--danger)"
                      : "transparent",
                  fontWeight: 700,
                }}
              >
                Rolled back
              </button>
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
              CURATED HACKATHON DEMO RUN
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
              {currentRun.issue}
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
                  <ExplorerVisualizer data={mockSnapshot.explorer_snapshot} />
                )}
                {displayedStage.id === "mapper" && (
                  <SourceMapperVisualizer data={mockSnapshot.source_snapshot} />
                )}
                {displayedStage.id === "analyzer" && (
                  <AnalyzerVisualizer data={mockSnapshot.analysis_snapshot} />
                )}
                {displayedStage.id === "repair" && (
                  <RepairVisualizer
                    data={
                      displayedStage.status === "queued"
                        ? null
                        : mockSnapshot.repair_snapshot
                    }
                  />
                )}
                {displayedStage.id === "verifier" && (
                  <VerifierVisualizer
                    data={
                      displayedStage.status === "queued"
                        ? null
                        : mockSnapshot.verification_snapshot
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
                        className={`event-dot ${s.status === "running" ? "running pulse" : s.status === "complete" ? "complete" : s.status === "failed" ? "failed" : "queued"}`}
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
                        {s.name} Stage {s.progress.toLowerCase()}
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
