export type RunnableState = "IDLE" | "RUNNING" | "SUCCESS" | "ERROR" | "SERVER_OFFLINE"

export interface ExecutionResult {
  bindings?: Record<string, unknown>[]
  inserts?: number
  deletes?: number
  raw?: unknown
}

export interface ExecutionError {
  message: string
  detail?: string
  isNetworkError: boolean
  isCorsError: boolean
  isTimeout: boolean
}
