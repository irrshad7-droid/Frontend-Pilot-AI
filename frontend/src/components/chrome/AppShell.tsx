import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: ReactNode
  showBack?: boolean
}

export function AppShell({ children, showBack }: AppShellProps) {
  return (
    <div className="app-shell">
      <TopBar showBack={showBack} />
      {children}
    </div>
  )
}
