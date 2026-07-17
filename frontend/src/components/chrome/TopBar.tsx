import { Activity, ArrowLeft } from 'lucide-react'
import { navigateHome } from '../../hooks/useHashRoute'

interface TopBarProps {
  showBack?: boolean
}

export function TopBar({ showBack = false }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="brand-cluster">
        {showBack && (
          <button className="icon-button" onClick={navigateHome} aria-label="Return to landing page">
            <ArrowLeft size={17} />
          </button>
        )}
        <div className="brand-mark" aria-hidden="true"><Activity size={17} /></div>
        <span className="brand-name">FrontendPilot <em>AI</em></span>
      </div>
      <div className="top-bar-meta">
        <span className="environment-dot" />
        <span>Local workspace</span>
      </div>
    </header>
  )
}
