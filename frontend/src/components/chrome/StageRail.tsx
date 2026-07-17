import { BrainCircuit, Check, Compass, FileSearch, ShieldCheck, Wrench } from 'lucide-react'
import type { PipelineStage } from '../../types/pipeline'

const icons = {
  explorer: Compass,
  mapper: FileSearch,
  analyzer: BrainCircuit,
  repair: Wrench,
  verifier: ShieldCheck,
}

interface StageRailProps {
  stages: PipelineStage[]
}

export function StageRail({ stages }: StageRailProps) {
  return (
    <nav className="stage-rail" aria-label="Pipeline stages">
      <p className="eyebrow">Autonomous run</p>
      <div className="stage-list">
        {stages.map((stage, index) => {
          const Icon = icons[stage.id]
          return (
            <div className={`stage-item stage-item-${stage.status}`} key={stage.id}>
              <div className="stage-line" aria-hidden="true" />
              <div className="stage-icon"><Icon size={17} /></div>
              <div className="stage-copy">
                <span>{stage.name}</span>
                <small>{stage.status === 'complete' ? <Check size={12} /> : null}{stage.progress}</small>
              </div>
              {index === stages.length - 1 ? null : <span className="stage-sequence">0{index + 1}</span>}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
