import type { PipelineStage } from "../../types/pipeline";
import { stageColors } from "../../types/pipeline";

// ---------------------------------------------------------------------------
// Shared card tilt effect (used by both dashboard pages)
// ---------------------------------------------------------------------------

export function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
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
}

export function handleCardMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  el.style.setProperty("--rot-x", "0deg");
  el.style.setProperty("--rot-y", "0deg");
}

// ---------------------------------------------------------------------------
// Mobile pipeline nav (shared between demo and live pages)
// ---------------------------------------------------------------------------

export function MobilePipeline({
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