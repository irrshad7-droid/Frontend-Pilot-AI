export type PipelineStageId = 'explorer' | 'mapper' | 'analyzer' | 'repair' | 'verifier'

export type StageStatus = 'complete' | 'running' | 'queued' | 'failed'

export interface PipelineStage {
  id: PipelineStageId
  name: string
  snapshot: string
  status: StageStatus
  duration: string
  progress: string
  summary: string
  insight: string
  facts: string[]
}

export interface RunFixture {
  id: string
  targetName: string
  targetUrl: string
  issue: string
  observedBehavior: string
  status: 'Running' | 'Success' | 'Failed' | 'Error'
  startedAt: string
  elapsed: string
  stages: PipelineStage[]
}
