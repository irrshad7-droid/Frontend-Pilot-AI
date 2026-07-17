import { LandingPage } from './features/landing/LandingPage'
import { RunDashboardPage } from './features/run/RunDashboardPage'
import { useHashRoute } from './hooks/useHashRoute'

function App() {
  const route = useHashRoute()
  return route.kind === 'run' ? <RunDashboardPage /> : <LandingPage />
}

export default App
