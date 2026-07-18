import { LandingPage } from './features/landing/LandingPage'
import { RunDashboardPage } from './features/run/RunDashboardPage'
import { LiveRunDashboardPage } from './features/run/LiveRunDashboardPage'
import { useHashRoute } from './hooks/useHashRoute'
import { demoRun } from './fixtures/demoRun'

function App() {
  const route = useHashRoute()

  if (route.kind === 'run') {
    // Fixture demo mode — the curated "Clear completed" investigation
    if (route.runId === demoRun.id) {
      return <RunDashboardPage />
    }
    // Real run mode — polling a live backend pipeline
    return <LiveRunDashboardPage runId={route.runId} />
  }

  return <LandingPage />
}

export default App
