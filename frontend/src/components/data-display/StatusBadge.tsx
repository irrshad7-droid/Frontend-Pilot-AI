import type { StageStatus } from '../../types/pipeline'

interface StatusBadgeProps {
  status: StageStatus | 'Running' | 'Success' | 'Failed' | 'Error'
}

const labels: Record<StatusBadgeProps['status'], string> = {
  complete: 'Complete',
  running: 'Running',
  queued: 'Queued',
  failed: 'Failed',
  Running: 'Live run',
  Success: 'Verified',
  Failed: 'Failed',
  Error: 'Error',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{labels[status]}</span>
}
