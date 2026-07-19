import { useState, useEffect } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  Compass,
  AlertTriangle,
  Cpu,
  FileCode,
  FileSearch,
  ShieldCheck,
  Wrench,
  Terminal,
  Server,
  HelpCircle,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Shared visual helpers
// ---------------------------------------------------------------------------

function ConfidenceBadge({
  level,
}: {
  level: "High" | "Medium" | "Low" | string;
}) {
  const colors = {
    High: {
      border: "rgba(16, 185, 129, 0.2)",
      text: "#10b981",
      bg: "rgba(16, 185, 129, 0.06)",
    },
    Medium: {
      border: "rgba(245, 158, 11, 0.2)",
      text: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.06)",
    },
    Low: {
      border: "rgba(239, 68, 68, 0.2)",
      text: "#ef4444",
      bg: "rgba(239, 68, 68, 0.06)",
    },
  }[level as "High" | "Medium" | "Low"] || {
    border: "var(--border)",
    text: "var(--text-secondary)",
    bg: "var(--surface-muted)",
  };

  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: "999px",
        border: `1px solid ${colors.border}`,
        color: colors.text,
        backgroundColor: colors.bg,
        fontSize: "10px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {level} Confidence
    </span>
  );
}

function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#090a0f",
        margin: "8px 0",
      }}
    >
      {filename && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
            color: "var(--text-secondary)",
            fontSize: "11px",
            fontFamily: "monospace",
          }}
        >
          <FileCode size={13} />
          {filename}
        </div>
      )}
      <pre
        style={{
          margin: 0,
          padding: "12px",
          overflowX: "auto",
          fontSize: "12px",
          lineHeight: "1.5",
          color: "#e2e8f0",
          fontFamily: "SFMono-Regular, Consolas, Monaco, monospace",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Explorer Visualizer
// ---------------------------------------------------------------------------

export function ExplorerVisualizer({ data }: { data: any }) {
  const [activeScreenshotTab, setActiveScreenshotTab] = useState<
    "before" | "after"
  >("before");

  if (!data) return <EmptyState stage="Explorer" />;

  const summary = data.page_summary || {};
  const evidence = data.runtime_evidence || {};
  const consoleEvents = data.console_events || [];
  const networkFailures = data.network_failures || [];
  const screenshots = data.screenshots || [];

  const getFullUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("/") || path.startsWith("http")) {
      if (path.startsWith("/api")) {
        return `http://localhost:8000${path}`;
      }
      return path;
    }
    return `http://localhost:8000/api/artifacts/${path}`;
  };

  // Find the selected screenshot
  const selectedScreenshot =
    screenshots.find((s: any) => s.name === activeScreenshotTab) ||
    screenshots[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Target and Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        <div className="panel-card" style={{ padding: "14px" }}>
          <span className="eyebrow" style={{ fontSize: "9px" }}>
            Page Title
          </span>
          <strong
            style={{
              display: "block",
              fontSize: "14px",
              marginTop: "4px",
              color: "var(--text)",
            }}
          >
            {summary.title || "Todo App"}
          </strong>
        </div>
        <div className="panel-card" style={{ padding: "14px" }}>
          <span className="eyebrow" style={{ fontSize: "9px" }}>
            Total Interactive Elements
          </span>
          <strong
            style={{
              display: "block",
              fontSize: "18px",
              marginTop: "4px",
              color: "#06b6d4",
            }}
          >
            {summary.total_interactive_elements || 0}
          </strong>
        </div>
        <div className="panel-card" style={{ padding: "14px" }}>
          <span className="eyebrow" style={{ fontSize: "9px" }}>
            Buttons / Inputs
          </span>
          <strong
            style={{
              display: "block",
              fontSize: "14px",
              marginTop: "4px",
              color: "var(--text-secondary)",
            }}
          >
            {summary.button_count || 0} Buttons · {summary.input_count || 0}{" "}
            Inputs
          </strong>
        </div>
      </div>

      {/* Target Screen Capture & Evidences */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Dynamic Screen Capture Frame */}
        <div
          className="panel-card"
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span className="eyebrow" style={{ color: "#06b6d4" }}>
              TARGET STATE SCREENSHOT
            </span>

            {screenshots.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  background: "var(--surface-muted)",
                  padding: "2px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveScreenshotTab("before")}
                  aria-pressed={activeScreenshotTab === "before"}
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: 0,
                    cursor: "pointer",
                    background:
                      activeScreenshotTab === "before"
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    color:
                      activeScreenshotTab === "before"
                        ? "var(--text)"
                        : "var(--text-muted)",
                  }}
                >
                  BEFORE
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreenshotTab("after")}
                  aria-pressed={activeScreenshotTab === "after"}
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: 0,
                    cursor: "pointer",
                    background:
                      activeScreenshotTab === "after"
                        ? "rgba(255,255,255,0.06)"
                        : "transparent",
                    color:
                      activeScreenshotTab === "after"
                        ? "var(--text)"
                        : "var(--text-muted)",
                  }}
                >
                  AFTER
                </button>
              </div>
            )}
          </div>

          {/* Browser Capture Wrapper */}
          <div
            className="screenshot-radar"
            style={{
              position: "relative",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "#090a0f",
              aspectRatio: "4/3",
              display: "grid",
              placeItems: "center",
            }}
          >
            {selectedScreenshot ? (
              <>
                <img
                  src={getFullUrl(selectedScreenshot.path)}
                  alt={`${selectedScreenshot.name} snapshot`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
                {/* Rotating Circular Radar Overlay */}
                <svg
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    opacity: 0.15,
                  }}
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="0.3"
                    strokeDasharray="1 1"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="0.2"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="15"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="0.2"
                  />
                  <line
                    x1="50"
                    y1="5"
                    x2="50"
                    y2="95"
                    stroke="#06b6d4"
                    strokeWidth="0.2"
                  />
                  <line
                    x1="5"
                    y1="50"
                    x2="95"
                    y2="50"
                    stroke="#06b6d4"
                    strokeWidth="0.2"
                  />
                  <g
                    className="radar-sweep-line"
                    style={{ transformOrigin: "50px 50px" }}
                  >
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="5"
                      stroke="#06b6d4"
                      strokeWidth="0.6"
                      opacity="0.8"
                    />
                  </g>
                </svg>

                {/* Active scan line sweep animation overlay */}
                <div className="scanner-line" />

                {/* Dynamic targeting sights representing coordinate harvesting */}
                <div
                  className="targeting-ring"
                  style={{ top: "76%", left: "72%" }}
                />
                <div
                  className="targeting-crosshair"
                  style={{ top: "76%", left: "72%" }}
                />
              </>
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                <Eye size={24} style={{ marginBottom: "8px", opacity: 0.3 }} />
                <span>No screenshots captured</span>
              </div>
            )}
          </div>
        </div>

        {/* DOM Evidence / Observation details */}
        <div
          className="investigation-canvas"
          style={{
            gridTemplateColumns: "1fr",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              paddingBottom: "10px",
              marginBottom: "10px",
            }}
          >
            <Compass size={18} style={{ color: "#06b6d4" }} />
            <span
              className="eyebrow"
              style={{ letterSpacing: "0.05em", color: "#06b6d4" }}
            >
              Runtime Evidence Harvested
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "13px",
            }}
          >
            <div>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "10px",
                  display: "block",
                  fontWeight: 700,
                }}
              >
                EXPECTED BEHAVIOR
              </span>
              <p style={{ margin: "4px 0 0 0", color: "var(--text)" }}>
                {evidence.expected_interaction || "Clear completed todo items."}
              </p>
            </div>
            <div>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "10px",
                  display: "block",
                  fontWeight: 700,
                }}
              >
                OBSERVED DOM CHANGE
              </span>
              <p style={{ margin: "4px 0 0 0", color: "var(--danger)" }}>
                {evidence.observed_dom_change ||
                  "No change detected in active todo items counts."}
              </p>
            </div>
            <div>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "10px",
                  display: "block",
                  fontWeight: 700,
                }}
              >
                VISUAL OUTCOME
              </span>
              <p
                style={{ margin: "4px 0 0 0", color: "var(--text-secondary)" }}
              >
                {evidence.observed_visual_change || "Todo remains visible."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs and Network failures */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        <div className="panel-card" style={{ padding: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px",
            }}
          >
            <Terminal size={14} style={{ color: "var(--text-secondary)" }} />
            <h4
              style={{ margin: 0, fontSize: "13px", letterSpacing: "-0.01em" }}
            >
              Console Output
            </h4>
          </div>
          {consoleEvents.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                margin: 0,
              }}
            >
              No console logs recorded.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "150px",
                overflowY: "auto",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              {consoleEvents.map((evt: any, i: number) => (
                <div
                  key={i}
                  className="animate-log-line"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    color:
                      evt.severity === "error"
                        ? "var(--danger)"
                        : evt.severity === "warning"
                          ? "var(--warning)"
                          : "var(--text-secondary)",
                  }}
                >
                  [{evt.severity?.toUpperCase()}] {evt.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card" style={{ padding: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "12px",
            }}
          >
            <Server size={14} style={{ color: "var(--text-secondary)" }} />
            <h4
              style={{ margin: 0, fontSize: "13px", letterSpacing: "-0.01em" }}
            >
              Network Activity
            </h4>
          </div>
          {networkFailures.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                margin: 0,
              }}
            >
              No network failures recorded.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "150px",
                overflowY: "auto",
                fontSize: "11px",
              }}
            >
              {networkFailures.map((net: any, i: number) => (
                <div
                  key={i}
                  className="animate-log-line"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    color: "var(--danger)",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {net.method} {net.url}
                  </span>
                  <strong>{net.status}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Source Mapper Visualizer
// ---------------------------------------------------------------------------

export function SourceMapperVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Source Mapper" />;

  const files = data.candidate_files || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileSearch size={18} style={{ color: "var(--signal-bright)" }} />
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 650,
              letterSpacing: "-0.02em",
            }}
          >
            Mapped AST Nodes
          </h3>
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Target:{" "}
          <code style={{ color: "var(--signal-bright)" }}>
            {data.target_observation || "Clear completed button"}
          </code>
        </span>
      </div>

      {files.length === 0 ? (
        <div
          className="panel-card"
          style={{
            padding: "24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          No source file candidates mapped.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            position: "relative",
          }}
        >
          {/* Animated background grid for AST visualizer */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.05,
              backgroundImage:
                "radial-gradient(var(--border) 1.5px, transparent 1.5px)",
              backgroundSize: "18px 18px",
              pointerEvents: "none",
            }}
          />

          {files.map((file: any, i: number) => (
            <div
              key={i}
              className="panel-card animate-fade-in-up"
              style={{
                padding: "18px",
                background: "rgba(18, 20, 28, 0.4)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                animationDelay: `${i * 0.1}s`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* File Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    minWidth: 0,
                  }}
                >
                  <FileCode
                    size={16}
                    style={{ color: "var(--signal-bright)" }}
                  />
                  <strong
                    style={{
                      fontSize: "13px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "var(--text)",
                    }}
                  >
                    {file.file_path}
                  </strong>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <ConfidenceBadge
                    level={
                      file.heuristic_confidence >= 0.8
                        ? "High"
                        : file.heuristic_confidence >= 0.5
                          ? "Medium"
                          : "Low"
                    }
                  />
                </div>
              </div>

              {/* AST Node Flowchart Container */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  position: "relative",
                  paddingLeft: "18px",
                }}
              >
                {/* Visual SVG paths drawing dynamic lines connecting elements */}
                <svg
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "16px",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                >
                  <path
                    d="M 6 0 L 6 1000"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <path
                    className="ast-pulse-path"
                    d="M 6 0 L 6 150"
                    fill="none"
                    stroke="var(--signal-bright)"
                    strokeWidth="2"
                  />
                </svg>

                {(file.components || []).map((comp: any, ci: number) => (
                  <div
                    key={ci}
                    className="animate-ast-node"
                    style={{
                      borderLeft: "2px solid var(--border)",
                      paddingLeft: "16px",
                      marginLeft: "6px",
                      marginTop: "4px",
                      animationDelay: `${ci * 0.15}s`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "8px",
                      }}
                    >
                      <Cpu
                        size={13}
                        style={{ color: "var(--text-secondary)" }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                        }}
                      >
                        Component: {comp.component_name}
                      </span>
                    </div>

                    {/* Matching nodes/snippet */}
                    {(comp.matching_nodes || []).map(
                      (node: any, ni: number) => (
                        <div key={ni} style={{ marginTop: "10px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              marginBottom: "6px",
                            }}
                          >
                            <span>Match Heuristic: {node.match_reason}</span>
                            <span>
                              Lines {node.line_start}-{node.line_end}
                            </span>
                          </div>
                          <CodeBlock code={node.snippet} />
                        </div>
                      ),
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Analyzer Visualizer
// ---------------------------------------------------------------------------

export function AnalyzerVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Analyzer" />;

  const hypotheses = data.competing_hypotheses || [];
  const conclusion = data.conclusion || {};
  const repairCtx = data.repair_context || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Conclusion Card */}
      <div
        className="investigation-canvas"
        style={{
          gridTemplateColumns: "1fr",
          padding: "20px",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          background:
            "radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.1), transparent 12rem), linear-gradient(125deg, #0f1614, #080c0b)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BrainCircuit size={20} style={{ color: "#10b981" }} />
            <span className="eyebrow" style={{ color: "#10b981" }}>
              CONVERGED CONCLUSION
            </span>
          </div>
          <ConfidenceBadge
            level={conclusion.investigation_confidence || "High"}
          />
        </div>
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: "1.4",
            color: "var(--text)",
          }}
        >
          {conclusion.root_cause || "Root cause identified."}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: "1.5",
          }}
        >
          {conclusion.confidence_rationale}
        </p>
      </div>

      {/* Competing Hypotheses */}
      <div>
        <h4 className="eyebrow" style={{ marginBottom: "10px" }}>
          COMPETING HYPOTHESES EVALUATION
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {hypotheses.map((hyp: any, i: number) => {
            const isFavored = hyp.plausibility_score === "High";
            return (
              <div
                key={i}
                className="panel-card animate-fade-in-up"
                style={{
                  padding: "14px",
                  border: isFavored
                    ? "1px solid rgba(16, 185, 129, 0.2)"
                    : "1px solid var(--border)",
                  background: isFavored
                    ? "rgba(16, 185, 129, 0.02)"
                    : "var(--surface)",
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: isFavored
                          ? "#10b981"
                          : "var(--surface-raised)",
                        color: isFavored ? "black" : "var(--text-muted)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "10px",
                        fontWeight: 800,
                      }}
                    >
                      {i + 1}
                    </span>
                    <strong
                      style={{
                        fontSize: "13px",
                        color: isFavored
                          ? "var(--text)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {hyp.hypothesis}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: isFavored
                          ? "#10b981"
                          : hyp.plausibility_score === "Medium"
                            ? "var(--warning)"
                            : "var(--text-muted)",
                      }}
                    >
                      {hyp.plausibility_score} Plausibility
                    </span>
                    <div
                      style={{
                        width: "80px",
                        height: "3px",
                        borderRadius: "2px",
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="animate-fill-bar"
                        style={{
                          height: "100%",
                          background: isFavored
                            ? "#10b981"
                            : hyp.plausibility_score === "Medium"
                              ? "var(--warning)"
                              : "var(--danger)",
                          width: isFavored
                            ? "100%"
                            : hyp.plausibility_score === "Medium"
                              ? "60%"
                              : "25%",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ paddingLeft: "26px", fontSize: "12px" }}>
                  {/* Support evidence list */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginTop: "6px",
                    }}
                  >
                    {(hyp.supporting_evidence || []).map(
                      (e: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: "rgba(255,255,255,0.03)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                            fontSize: "10px",
                          }}
                        >
                          + {e}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Repair Objectives */}
      {repairCtx.repair_objectives && (
        <div className="panel-card" style={{ padding: "16px" }}>
          <h4 className="eyebrow" style={{ marginBottom: "8px" }}>
            REPAIR OBJECTIVES
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              fontSize: "13px",
              color: "var(--text-secondary)",
              lineHeight: "1.6",
            }}
          >
            {repairCtx.repair_objectives.map((obj: string, i: number) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SelfTypingCode({ code, color }: { code: string; color: string }) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < code.length) {
        setTyped(code.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 10);
    return () => clearInterval(timer);
  }, [code]);

  return (
    <pre
      style={{
        margin: "6px 0 0 0",
        padding: 0,
        fontSize: "12.5px",
        color,
        fontFamily: "monospace",
        overflowX: "auto",
        whiteSpace: "pre-wrap",
        lineHeight: "1.55",
      }}
    >
      {typed}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// 4. Repair Visualizer (Patch/Diff Viewer)
// ---------------------------------------------------------------------------

export function RepairVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Repair" />;

  const diffs = data.diff || [];
  const target = data.target_file || "target-app/src/App.tsx";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Wrench size={18} style={{ color: "var(--signal-bright)" }} />
          <h3
            style={{
              margin: 0,
              fontSize: "15px",
              fontWeight: 650,
              letterSpacing: "-0.02em",
            }}
          >
            Surgical Patch Diff
          </h3>
        </div>
        <ConfidenceBadge level={data.repair_confidence || "High"} />
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: "1.5",
        }}
      >
        <p style={{ margin: "0 0 10px 0" }}>{data.patch_explanation}</p>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Target File:{" "}
          <code style={{ color: "var(--signal-bright)" }}>{target}</code>
        </span>
      </div>

      {diffs.length === 0 ? (
        <div
          className="panel-card"
          style={{
            padding: "24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          No diff blocks generated.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {diffs.map((diff: any, idx: number) => (
            <div
              key={idx}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#090a0f",
              }}
            >
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.02)",
                  padding: "12px",
                  borderLeft: "3px solid #ef4444",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  className="eyebrow"
                  style={{
                    fontSize: "9px",
                    color: "#ef4444",
                    letterSpacing: "0.08em",
                  }}
                >
                  SEARCH FOR (ORIGINAL)
                </span>
                <SelfTypingCode code={diff.search_block} color="#f87171" />
              </div>
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.02)",
                  padding: "12px",
                  borderLeft: "3px solid #10b981",
                }}
                className="animate-patch-glow"
              >
                <span
                  className="eyebrow"
                  style={{
                    fontSize: "9px",
                    color: "#10b981",
                    letterSpacing: "0.08em",
                  }}
                >
                  REPLACE WITH (PATCHED)
                </span>
                <SelfTypingCode code={diff.replace_block} color="#34d399" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risks */}
      {data.repair_risks && data.repair_risks.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            padding: "10px 14px",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "6px",
            background: "rgba(245, 158, 11, 0.02)",
            color: "#f59e0b",
            fontSize: "12px",
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>
            <strong>Risk Assessment:</strong> {data.repair_risks.join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Verifier Visualizer
// ---------------------------------------------------------------------------

export function VerifierVisualizer({ data }: { data: any }) {
  const steps = data?.executed_steps || [];
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (activeStepIndex >= steps.length) return;
    const timer = setTimeout(() => {
      setActiveStepIndex((prev) => prev + 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [activeStepIndex, steps.length]);

  if (!data) return <EmptyState stage="Verifier" />;

  const passed = data.verification_status === "Passed";
  const inconclusive = data.verification_status === "Inconclusive";
  const regressions = data.regressions_detected || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Verification status header */}
      <div
        className="investigation-canvas animate-fade-in-up"
        style={{
          gridTemplateColumns: "1fr",
          padding: "20px",
          border: passed
            ? "1px solid rgba(16, 185, 129, 0.25)"
            : inconclusive
              ? "1px solid rgba(245, 158, 11, 0.25)"
              : "1px solid rgba(239, 68, 68, 0.25)",
          background: passed
            ? "radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.1), transparent 12rem), linear-gradient(125deg, #0f1614, #080c0b)"
            : inconclusive
              ? "radial-gradient(circle at 10% 10%, rgba(245, 158, 11, 0.1), transparent 12rem), linear-gradient(125deg, #18150f, #0d0b08)"
              : "radial-gradient(circle at 10% 10%, rgba(239, 68, 68, 0.1), transparent 12rem), linear-gradient(125deg, #180f0f, #0d0808)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <ShieldCheck
            size={22}
            style={{
              color: passed ? "#10b981" : inconclusive ? "#f59e0b" : "#ef4444",
            }}
          />
          <span
            className="eyebrow"
            style={{
              color: passed ? "#10b981" : inconclusive ? "#f59e0b" : "#ef4444",
            }}
          >
            VERIFICATION {data.verification_status?.toUpperCase() || "COMPLETE"}
          </span>
        </div>
        <h3
          style={{
            margin: "0 0 6px 0",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {data.pass_fail_reason || "Verification process completed."}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          Rollback Triggered:{" "}
          <strong
            style={{
              color: data.rollback_required
                ? "var(--danger)"
                : "var(--success)",
            }}
          >
            {data.rollback_required
              ? "YES (Restoring baseline)"
              : "NO (Patch preserved)"}
          </strong>
        </p>
      </div>

      {/* Executed steps / assertions */}
      <div>
        <h4 className="eyebrow" style={{ marginBottom: "10px" }}>
          EXECUTED PLAYWRIGHT ASSERTIONS
        </h4>
        {steps.length === 0 ? (
          <p
            style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}
          >
            No steps executed.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {steps.map((step: any, idx: number) => {
              const isResolved = idx < activeStepIndex;
              const isActive = idx === activeStepIndex;
              const isQueued = idx > activeStepIndex;

              return (
                <div
                  key={idx}
                  className="panel-card"
                  style={{
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isResolved
                      ? "rgba(16, 185, 129, 0.01)"
                      : isActive
                        ? "rgba(245, 158, 11, 0.02)"
                        : "rgba(255,255,255,0.01)",
                    borderLeft: isResolved
                      ? "3px solid #10b981"
                      : isActive
                        ? "3px solid #f59e0b"
                        : "1px solid var(--border)",
                    opacity: isQueued ? 0.35 : 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isResolved ? (
                      <div
                        style={{
                          position: "relative",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <div
                          className="ripple-circle"
                          style={{
                            position: "absolute",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            border: "1px solid #10b981",
                            pointerEvents: "none",
                          }}
                        />
                        <CheckCircle2
                          size={14}
                          style={{
                            color: "#10b981",
                            position: "relative",
                            zIndex: 1,
                          }}
                        />
                      </div>
                    ) : isActive ? (
                      <span
                        className="pulse-dot"
                        style={{
                          background: "#f59e0b",
                          width: "8px",
                          height: "8px",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--border)",
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: "13px",
                        fontFamily: "monospace",
                        color: isQueued ? "var(--text-muted)" : "var(--text)",
                      }}
                    >
                      {step.action}({step.selector}){" "}
                      {step.value ? `-> "${step.value}"` : ""}{" "}
                      {step.expected ? `[Expected: "${step.expected}"]` : ""}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: isResolved
                        ? "#10b981"
                        : isActive
                          ? "#f59e0b"
                          : "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {isResolved ? "PASS" : isActive ? "RUNNING…" : "QUEUED"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Regressions log */}
      {regressions.length > 0 && (
        <div
          className="panel-card"
          style={{
            padding: "14px",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            background: "rgba(239, 68, 68, 0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#ef4444",
              marginBottom: "8px",
            }}
          >
            <AlertTriangle size={15} />
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>
              Regressions Detected
            </h4>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "18px",
              fontSize: "12px",
              color: "var(--text-secondary)",
            }}
          >
            {regressions.map((reg: string, idx: number) => (
              <li key={idx}>{reg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Empty State / Loading helper
// ---------------------------------------------------------------------------

function EmptyState({ stage }: { stage: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "240px",
        color: "var(--text-muted)",
        border: "1px dashed var(--border)",
        borderRadius: "12px",
        background: "rgba(0,0,0,0.08)",
      }}
    >
      <HelpCircle size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
      <h3
        style={{
          margin: "0 0 4px 0",
          fontSize: "14px",
          fontWeight: 650,
          color: "var(--text-secondary)",
        }}
      >
        No details available for {stage}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          maxWidth: "300px",
          textAlign: "center",
          lineHeight: "1.4",
        }}
      >
        The pipeline must reach or complete this stage during execution before
        snapshot artifacts become accessible.
      </p>
    </div>
  );
}
