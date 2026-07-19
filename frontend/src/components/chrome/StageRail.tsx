import { BrainCircuit, Check, Compass, FileSearch, ShieldCheck, Wrench } from 'lucide-react'
import type { PipelineStage } from '../../types/pipeline'
import { stageColors } from '../../types/pipeline'

const icons = {
  explorer: Compass,
  mapper: FileSearch,
  analyzer: BrainCircuit,
  repair: Wrench,
  verifier: ShieldCheck,
}

interface StageRailProps {
  stages: PipelineStage[]
  selectedStageId: string
  onSelectStage: (id: string) => void
}

export function StageRail({ stages, selectedStageId, onSelectStage }: StageRailProps) {
  return (
    <nav className="stage-rail" aria-label="Pipeline stages" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <p className="eyebrow" style={{ letterSpacing: '0.08em', marginBottom: '4px' }}>Autonomous run</p>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Select a stage to inspect</span>
      </div>
      
      <div className="stage-list" style={{ marginTop: '12px' }}>
        {stages.map((stage, index) => {
          const Icon = icons[stage.id]
          const isSelected = stage.id === selectedStageId
          const activeColor = stageColors[stage.id]
          
          return (
            <div 
              className={`stage-item stage-item-${stage.status}`} 
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '8px 12px',
                margin: '2px -8px',
                transition: 'all 0.2s ease',
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                border: isSelected ? `1px solid ${activeColor}33` : '1px solid transparent',
                boxShadow: isSelected ? `0 0 15px ${activeColor}0a` : 'none',
              }}
            >
              <div className="stage-line" aria-hidden="true" style={{ left: '26px' }} />
              
              <div 
                className="stage-icon" 
                style={{ 
                  color: isSelected ? activeColor : undefined,
                  borderColor: isSelected ? `${activeColor}aa` : undefined,
                  boxShadow: isSelected ? `0 0 8px ${activeColor}44` : undefined,
                  width: '28px',
                  height: '28px',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon size={16} />
              </div>
              
              <div className="stage-copy" style={{ marginLeft: '4px' }}>
                <span style={{ 
                  color: isSelected ? 'var(--text)' : undefined, 
                  fontWeight: isSelected ? 750 : undefined 
                }}>
                  {stage.name}
                </span>
                <small style={{ 
                  color: isSelected ? activeColor : undefined 
                }}>
                  {stage.status === 'complete' ? <Check size={10} style={{ marginRight: '2px' }} /> : null}
                  {stage.progress}
                </small>
              </div>
              
              {index === stages.length - 1 ? null : (
                <span className="stage-sequence" style={{ opacity: isSelected ? 0.7 : 0.3 }}>
                  0{index + 1}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
