import { useEffect, useState } from 'react'

export type AppRoute =
  | { kind: 'landing' }
  | { kind: 'run'; runId: string }

function readRoute(): AppRoute {
  const match = window.location.hash.match(/^#\/runs\/([^/]+)$/)
  return match ? { kind: 'run', runId: match[1] } : { kind: 'landing' }
}

export function useHashRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(readRoute)

  useEffect(() => {
    const updateRoute = () => setRoute(readRoute())
    window.addEventListener('hashchange', updateRoute)
    return () => window.removeEventListener('hashchange', updateRoute)
  }, [])

  return route
}

export function navigateToRun(runId: string) {
  window.location.hash = `/runs/${runId}`
}

export function navigateHome() {
  window.location.hash = ''
}
