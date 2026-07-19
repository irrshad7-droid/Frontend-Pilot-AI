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
  Search,
  Target,
  Accessibility,
  Code2,
  Bug,
  Check,
  X,
  GitCommit,
  FileDiff,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function SeverityBadge({
  level,
}: {
  level: "critical" | "high" | "medium" | "low";
}) {
  const m: Record<string, { color: string; bg: string; border: string }> = {
    critical: {
      color: "#ef4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.25)",
    },
    high: {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
    },
    medium: {
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.25)",
    },
    low: {
      color: "#6b7280",
      bg: "rgba(107,114,128,0.08)",
      border: "rgba(107,114,128,0.25)",
    },
  };
  const s = m[level] || m.medium;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "9px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: s.color,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      {level}
    </span>
  );
}

function ConfidenceBadge({
  level,
}: {
  level: "High" | "Medium" | "Low" | string;
}) {
  const m: Record<string, { border: string; text: string; bg: string }> = {
    High: {
      border: "rgba(16,185,129,0.2)",
      text: "#10b981",
      bg: "rgba(16,185,129,0.06)",
    },
    Medium: {
      border: "rgba(245,158,11,0.2)",
      text: "#f59e0b",
      bg: "rgba(245,158,11,0.06)",
    },
    Low: {
      border: "rgba(239,68,68,0.2)",
      text: "#ef4444",
      bg: "rgba(239,68,68,0.06)",
    },
  };
  const c = m[level as "High" | "Medium" | "Low"] || {
    border: "var(--border)",
    text: "var(--text-secondary)",
    bg: "var(--surface-muted)",
  };
  return (
    <span
      style={{
        padding: "3px 8px",
        borderRadius: "999px",
        border: `1px solid ${c.border}`,
        color: c.text,
        backgroundColor: c.bg,
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
// Stage Purpose Banner
// ---------------------------------------------------------------------------

function StagePurposeBanner({
  stageId,
  purpose,
}: {
  stageId: string;
  purpose: string;
}) {
  const labels: Record<string, { label: string; icon: React.ReactNode }> = {
    explorer: { label: "What happened?", icon: <Eye size={14} /> },
    mapper: { label: "Where is the bug?", icon: <Search size={14} /> },
    analyzer: { label: "Why did it happen?", icon: <BrainCircuit size={14} /> },
    repair: { label: "How do we fix it?", icon: <Wrench size={14} /> },
    verifier: { label: "Did the fix work?", icon: <ShieldCheck size={14} /> },
  };
  const info = labels[stageId] || {
    label: "Investigating...",
    icon: <HelpCircle size={14} />,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 14px",
        borderRadius: "8px",
        background: "rgba(139,140,255,0.04)",
        border: "1px solid rgba(139,140,255,0.12)",
        fontSize: "12px",
        lineHeight: "1.5",
        color: "var(--text-secondary)",
      }}
    >
      <span style={{ color: "var(--signal-bright)", marginTop: "1px" }}>
        {info.icon}
      </span>
      <div>
        <strong style={{ color: "var(--text)", fontSize: "11px" }}>
          {info.label}
        </strong>
        <p style={{ margin: "2px 0 0 0", color: "var(--text-muted)" }}>
          {purpose}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Explorer Visualizer
// ---------------------------------------------------------------------------

export function ExplorerVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Explorer" />;

  const summary = data.page_summary || {};
  const evidence = data.runtime_evidence || {};
  const consoleEvents = data.console_events || [];
  const networkFailures = data.network_failures || [];
  const screenshots = data.screenshots || [];
  const navigationFlow = data.navigation_flow || [];
  const severity: string = data.severity || "high";

  const getFullUrl = (p: string) => {
    if (!p) return "";
    if (p.startsWith("/api")) return `http://localhost:8000${p}`;
    return p;
  };

  const screenshot = screenshots[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StagePurposeBanner
        stageId="explorer"
        purpose="The agent launches Playwright, navigates to the target app, and replays the reported bug scenario to capture runtime state."
      />

      {/* Bug Report Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 14px",
          borderRadius: "8px",
          background: "rgba(239,68,68,0.04)",
          border: "1px solid rgba(239,68,68,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Bug size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
          <div>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
              }}
            >
              REPORTED ISSUE
            </span>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text)" }}>
              {data.reported_issue || evidence.expected_interaction || "Clear completed does nothing."}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <SeverityBadge level={severity as any} />
          <ConfidenceBadge level={data.confidence || "High"} />
        </div>
      </div>

      {/* Target and Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
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
            Interactive Elements
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
            {summary.button_count || 0} · {summary.input_count || 0}
          </strong>
        </div>
      </div>

      {/* Screenshot + Evidence */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))",
          gap: "20px",
        }}
      >
        <div
          className="panel-card"
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <span className="eyebrow" style={{ color: "#06b6d4" }}>
            OBSERVED STATE
          </span>
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
            {screenshot ? (
              <>
                <img
                  src={getFullUrl(screenshot.path)}
                  alt="Observed application state"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
                <div className="scanner-line" />
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
                <Eye
                  size={24}
                  style={{ marginBottom: "8px", opacity: 0.3 }}
                />
                <span>No screenshots captured</span>
              </div>
            )}
          </div>

          {navigationFlow.length > 0 && (
            <div>
              <span
                className="eyebrow"
                style={{ fontSize: "9px", color: "var(--text-muted)" }}
              >
                PLAYWRIGHT REPLAY STEPS
              </span>
              {navigationFlow.map((step: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "10px",
                    color: "var(--text-secondary)",
                    fontFamily: "monospace",
                    marginTop: "4px",
                  }}
                >
                  <span style={{ color: "#06b6d4", fontSize: "8px" }}>
                    {i + 1}.
                  </span>
                  <span>{step.action}</span>
                  {step.selector && (
                    <code
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "9px",
                        background: "rgba(255,255,255,0.03)",
                        padding: "1px 4px",
                        borderRadius: "3px",
                      }}
                    >
                      {step.selector.length > 50
                        ? step.selector.slice(0, 50) + "…"
                        : step.selector}
                    </code>
                  )}
                  {step.value && (
                    <span style={{ color: "var(--text-muted)" }}>
                      → "{step.value}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Runtime Evidence */}
        <div
          className="investigation-canvas"
          style={{
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
            }}
          >
            <Compass size={18} style={{ color: "#06b6d4" }} />
            <span
              className="eyebrow"
              style={{ color: "#06b6d4" }}
            >
              RUNTIME EVIDENCE
            </span>
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
              EXPECTED BEHAVIOR
            </span>
            <p style={{ margin: "4px 0 0", color: "var(--text)" }}>
              {evidence.expected_interaction}
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
            <p style={{ margin: "4px 0 0", color: "var(--danger)" }}>
              {evidence.observed_dom_change}
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
              ELEMENT STATE
            </span>
            <p
              style={{
                margin: "4px 0 0",
                color: "var(--text-secondary)",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            >
              {evidence.observed_element_state || "Element rendered in DOM"}
            </p>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
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
            <Terminal
              size={14}
              style={{ color: "var(--text-secondary)" }}
            />
            <h4
              style={{
                margin: 0,
                fontSize: "13px",
                letterSpacing: "-0.01em",
              }}
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
              No console output recorded during replay.
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
            <Server
              size={14}
              style={{ color: "var(--text-secondary)" }}
            />
            <h4
              style={{
                margin: 0,
                fontSize: "13px",
                letterSpacing: "-0.01em",
              }}
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
              No network failures detected.
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
  const astQuery = data.ast_query || "";
  const targetObservation = data.target_observation || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <StagePurposeBanner
        stageId="mapper"
        purpose="The agent traces the runtime evidence back to source code using Tree-sitter AST queries, mapping the DOM element to its JSX component and exact file location."
      />

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
            Source Code Mapping
          </h3>
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Target:{" "}
          <code style={{ color: "var(--signal-bright)" }}>
            {targetObservation || "Clear completed button"}
          </code>
        </span>
      </div>

      {astQuery && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "6px",
            background: "rgba(59,130,246,0.04)",
            border: "1px solid rgba(59,130,246,0.15)",
            fontSize: "11px",
            fontFamily: "monospace",
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              color: "#3b82f6",
              fontWeight: 700,
              fontSize: "9px",
            }}
          >
            AST QUERY
          </span>
          <pre style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>
            {astQuery}
          </pre>
        </div>
      )}

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
                background: "rgba(18,20,28,0.4)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                animationDelay: `${i * 0.1}s`,
                position: "relative",
              }}
            >
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

              {file.match_reason && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    background: "rgba(59,130,246,0.04)",
                    border: "1px solid rgba(59,130,246,0.1)",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    marginBottom: "14px",
                  }}
                >
                  <Target size={12} style={{ color: "#3b82f6" }} />
                  <span>
                    <strong style={{ color: "var(--text)" }}>
                      Match reason:
                    </strong>{" "}
                    {file.match_reason}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  position: "relative",
                  paddingLeft: "18px",
                }}
              >
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
                            <span>{node.match_reason}</span>
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
      <StagePurposeBanner
        stageId="analyzer"
        purpose="The agent evaluates competing hypotheses against runtime evidence and source code. Each hypothesis is scored by plausibility; the strongest explanation becomes the root cause driving the repair strategy."
      />

      <div>
        <h4 className="eyebrow" style={{ marginBottom: "10px" }}>
          COMPETING HYPOTHESES
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {hypotheses.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                margin: 0,
              }}
            >
              No hypotheses generated.
            </p>
          ) : (
            hypotheses.map((hyp: any, i: number) => {
              const isFavored = hyp.plausibility_score === "High";
              return (
                <div
                  key={i}
                  className="panel-card animate-fade-in-up"
                  style={{
                    padding: "14px",
                    border: isFavored
                      ? "1px solid rgba(16,185,129,0.2)"
                      : "1px solid var(--border)",
                    background: isFavored
                      ? "rgba(16,185,129,0.02)"
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
                        {hyp.plausibility_score}
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
            })
          )}
        </div>
      </div>

      {conclusion.root_cause && (
        <div
          className="investigation-canvas animate-fade-in-up"
          style={{
            padding: "20px",
            border: "1px solid rgba(16,185,129,0.25)",
            background:
              "radial-gradient(circle at 10% 10%, rgba(16,185,129,0.1), transparent 12rem), linear-gradient(125deg,#0f1614,#080c0b)",
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
            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <BrainCircuit size={20} style={{ color: "#10b981" }} />
              <span className="eyebrow" style={{ color: "#10b981" }}>
                ROOT CAUSE
              </span>
            </div>
            <ConfidenceBadge
              level={conclusion.investigation_confidence || "High"}
            />
          </div>
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: "1.4",
              color: "var(--text)",
            }}
          >
            {conclusion.root_cause}
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
      )}

      {repairCtx.repair_objectives &&
        repairCtx.repair_objectives.length > 0 && (
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

// ---------------------------------------------------------------------------
// SelfTypingCode
// ---------------------------------------------------------------------------

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
    }, 5);
    return () => clearInterval(timer);
  }, [code]);

  return (
    <pre
      style={{
        margin: "6px 0 0",
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
// 4. Repair Visualizer — PR-quality diff
// ---------------------------------------------------------------------------

export function RepairVisualizer({ data }: { data: any }) {
  if (!data) return <EmptyState stage="Repair" />;

  const diffs = data.diff || [];
  const target = data.target_file || "target-app/src/App.tsx";
  const commitMessage = data.commit_message || "";
  const modificationSummary = data.modification_summary || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <StagePurposeBanner
        stageId="repair"
        purpose="Based on the root cause, the agent synthesizes a minimal, surgical patch scoped to only the necessary lines, then validates syntax before applying."
      />

      {/* Commit Summary */}
      <div
        style={{
          padding: "14px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "rgba(16,185,129,0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <GitCommit size={16} style={{ color: "#10b981" }} />
          <span
            className="eyebrow"
            style={{ color: "#10b981", fontSize: "9px" }}
          >
            COMMIT SUMMARY
          </span>
          <ConfidenceBadge level={data.repair_confidence || "High"} />
        </div>
        {commitMessage && (
          <pre
            style={{
              margin: 0,
              fontSize: "12px",
              color: "var(--text)",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              lineHeight: "1.5",
            }}
          >
            {commitMessage}
          </pre>
        )}
        {modificationSummary && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: "1.5",
            }}
          >
            {modificationSummary}
          </p>
        )}
        {!commitMessage && !modificationSummary && (
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            {data.patch_explanation}
          </p>
        )}
      </div>

      {/* File header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          color: "var(--text-secondary)",
        }}
      >
        <FileDiff size={14} style={{ color: "var(--signal-bright)" }} />
        <span>
          Target file:{" "}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
              {/* Diff header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid var(--border)",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  fontFamily: "monospace",
                }}
              >
                <span style={{ color: "#ef4444" }}>−{diff.removed_lines || "?"}</span>
                <span style={{ color: "#10b981" }}>+{diff.added_lines || "?"}</span>
                <span style={{ flex: 1 }}>
                  @@ -{diff.search_start_line || "?"},{" "}
                  +{diff.replace_start_line || "?"} @@
                </span>
                {diff.change_reason && (
                  <span
                    style={{
                      color: "var(--signal-bright)",
                      fontSize: "9px",
                      fontWeight: 700,
                    }}
                  >
                    {diff.change_reason}
                  </span>
                )}
              </div>

              {/* Original */}
              <div
                style={{
                  padding: "12px",
                  borderLeft: "3px solid #ef4444",
                  background: "rgba(239,68,68,0.02)",
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
                  BEFORE
                </span>
                <SelfTypingCode code={diff.search_block} color="#f87171" />
              </div>

              {/* Patched */}
              <div
                style={{
                  padding: "12px",
                  borderLeft: "3px solid #10b981",
                  background: "rgba(16,185,129,0.02)",
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
                  AFTER
                </span>
                <SelfTypingCode code={diff.replace_block} color="#34d399" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Risk assessment */}
      {data.repair_risks && data.repair_risks.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            padding: "10px 14px",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "6px",
            background: "rgba(245,158,11,0.02)",
            color: "#f59e0b",
            fontSize: "12px",
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>
            <strong>Risk:</strong> {data.repair_risks.join(", ")}
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
  const regressions = data.regressions_detected || [];
  const verScreenshots = data.screenshots || [];
  const previousBehavior = data.previous_behavior || "";
  const currentBehavior = data.current_behavior || "";
  const runtimeAssertions = data.runtime_assertions || [];
  const consoleAssertions = data.console_assertions || [];
  const a11yStatus = data.accessibility_status || { violations: 0, passed: 0 };

  const getFullUrl = (p: string) => {
    if (!p) return "";
    if (p.startsWith("/api")) return `http://localhost:8000${p}`;
    return p;
  };

  const passCount = steps.filter(
    (_: any, i: number) => i < activeStepIndex,
  ).length;
  const totalCount = steps.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <StagePurposeBanner
        stageId="verifier"
        purpose="The agent replays the original bug scenario against the patched application, checking each step against expected behavior. All assertions must pass for the patch to be confirmed."
      />

      {/* How do we know this fix worked? — Status header */}
      <div
        className="investigation-canvas animate-fade-in-up"
        style={{
          padding: "20px",
          border: passed
            ? "1px solid rgba(16,185,129,0.25)"
            : "1px solid rgba(239,68,68,0.25)",
          background: passed
            ? "radial-gradient(circle at 10% 10%, rgba(16,185,129,0.1), transparent 12rem), linear-gradient(125deg,#0f1614,#080c0b)"
            : "radial-gradient(circle at 10% 10%, rgba(239,68,68,0.1), transparent 12rem), linear-gradient(125deg,#180f0f,#0d0808)",
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
            style={{ color: passed ? "#10b981" : "#ef4444" }}
          />
          <span
            className="eyebrow"
            style={{ color: passed ? "#10b981" : "#ef4444" }}
          >
            {passed ? "FIX CONFIRMED" : "VERIFICATION FAILED"}
          </span>
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
            }}
          >
            {passCount}/{totalCount} assertions passed
          </span>
        </div>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {passed
            ? "The patch resolves the reported issue. All assertions pass."
            : data.pass_fail_reason || "Verification failed."}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "var(--text-secondary)",
          }}
        >
          Rollback:{" "}
          <strong
            style={{
              color: data.rollback_required ? "var(--danger)" : "var(--success)",
            }}
          >
            {data.rollback_required ? "YES" : "NO"}
          </strong>
        </p>
      </div>

      {/* Behavior comparison: before vs after */}
      {(previousBehavior || currentBehavior) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div
            className="panel-card"
            style={{
              padding: "14px",
              borderLeft: "3px solid #ef4444",
            }}
          >
            <span
              className="eyebrow"
              style={{ fontSize: "9px", color: "#ef4444" }}
            >
              PREVIOUS BEHAVIOR (BROKEN)
            </span>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: "1.5",
              }}
            >
              {previousBehavior}
            </p>
          </div>
          <div
            className="panel-card"
            style={{
              padding: "14px",
              borderLeft: "3px solid #10b981",
            }}
          >
            <span
              className="eyebrow"
              style={{ fontSize: "9px", color: "#10b981" }}
            >
              CURRENT BEHAVIOR (FIXED)
            </span>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: "1.5",
              }}
            >
              {currentBehavior}
            </p>
          </div>
        </div>
      )}

      {/* Validation checks grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
          gap: "12px",
        }}
      >
        {/* Runtime validation */}
        <div className="panel-card" style={{ padding: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <Code2 size={13} style={{ color: "var(--signal-bright)" }} />
            <span className="eyebrow" style={{ fontSize: "9px" }}>
              RUNTIME VALIDATION
            </span>
          </div>
          {runtimeAssertions.length === 0 ? (
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
              No runtime assertions recorded.
            </p>
          ) : (
            runtimeAssertions.map((a: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color:
                    a.passed === true
                      ? "var(--success)"
                      : "var(--danger)",
                  marginTop: "4px",
                }}
              >
                {a.passed === true ? (
                  <Check size={10} />
                ) : (
                  <X size={10} />
                )}
                <span>{a.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Console validation */}
        <div className="panel-card" style={{ padding: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <Terminal size={13} style={{ color: "var(--signal-bright)" }} />
            <span className="eyebrow" style={{ fontSize: "9px" }}>
              CONSOLE VALIDATION
            </span>
          </div>
          {consoleAssertions.length === 0 ? (
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
              No new errors introduced.
            </p>
          ) : (
            consoleAssertions.map((a: any, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color:
                    a.passed === true
                      ? "var(--success)"
                      : "var(--danger)",
                  marginTop: "4px",
                }}
              >
                {a.passed === true ? (
                  <Check size={10} />
                ) : (
                  <X size={10} />
                )}
                <span>{a.message}</span>
              </div>
            ))
          )}
        </div>

        {/* Accessibility */}
        <div className="panel-card" style={{ padding: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <Accessibility size={13} style={{ color: "var(--signal-bright)" }} />
            <span className="eyebrow" style={{ fontSize: "9px" }}>
              ACCESSIBILITY
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "var(--success)" }}>
              {a11yStatus.passed || "—"} passed
            </span>
            {(a11yStatus.violations || 0) > 0 && (
              <span style={{ color: "var(--danger)" }}>
                {a11yStatus.violations} violations
              </span>
            )}
            {(!a11yStatus.violations || a11yStatus.violations === 0) && (
              <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                No new violations introduced
              </span>
            )}
          </div>
        </div>

        {/* Regression status */}
        <div className="panel-card" style={{ padding: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <AlertTriangle size={13} style={{ color: "var(--signal-bright)" }} />
            <span className="eyebrow" style={{ fontSize: "9px" }}>
              REGRESSIONS
            </span>
          </div>
          {regressions.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "var(--success)",
              }}
            >
              No regressions detected
            </p>
          ) : (
            regressions.map((r: string, i: number) => (
              <div
                key={i}
                style={{
                  fontSize: "11px",
                  color: "var(--danger)",
                  marginTop: "4px",
                }}
              >
                {r}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verification screenshots */}
      {verScreenshots.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))",
            gap: "12px",
          }}
        >
          {verScreenshots.map((s: any, i: number) => (
            <div
              key={i}
              className="panel-card"
              style={{
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <span
                className="eyebrow"
                style={{ fontSize: "9px", color: "var(--text-muted)" }}
              >
                {s.name === "after_patch"
                  ? "AFTER PATCH APPLIED"
                  : s.name?.toUpperCase().replace(/_/g, " ") || "SCREENSHOT"}
              </span>
              <div
                style={{
                  borderRadius: "6px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  background: "#090a0f",
                  aspectRatio: "4/3",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <img
                  src={getFullUrl(s.path)}
                  alt={s.name || "Verification screenshot"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Executed steps / assertions */}
      <div>
        <h4 className="eyebrow" style={{ marginBottom: "10px" }}>
          PLAYWRIGHT ASSERTIONS
        </h4>
        {steps.length === 0 ? (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
              margin: 0,
            }}
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
                      ? "rgba(16,185,129,0.01)"
                      : isActive
                        ? "rgba(245,158,11,0.02)"
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
                      <CheckCircle2 size={14} style={{ color: "#10b981" }} />
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
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
          margin: "0 0 4px",
          fontSize: "14px",
          fontWeight: 650,
          color: "var(--text-secondary)",
        }}
      >
        {stage} — awaiting data
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
        The pipeline must reach or complete this stage before artifacts become
        accessible.
      </p>
    </div>
  );
}