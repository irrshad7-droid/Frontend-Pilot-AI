import { useEffect, useRef, useState } from 'react'
import { getPipelineRun, type RunStatusResponse } from '../api/pipeline'

const POLL_INTERVAL_MS = 2500

/**
 * Polls a pipeline run by run_id.
 * Stops automatically when the run reaches a terminal state.
 * Cleans up the timer on unmount.
 */
export function usePipelineRun(runId: string | null) {
  const [data, setData] = useState<RunStatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!runId) return

    let cancelled = false

    async function poll() {
      try {
        const result = await getPipelineRun(runId!)
        if (cancelled) return
        setData(result)
        setError(null)

        // Stop polling on terminal status
        const terminal = ['Success', 'Failed', 'Error']
        if (terminal.includes(result.status) && timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    poll() // immediate first fetch

    timerRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [runId])

  return { data, error, loading }
}
