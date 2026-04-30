export type TabId = "curl" | "http" | "woql"

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

export type RunnableState = "IDLE" | "RUNNING" | "SUCCESS" | "ERROR" | "SERVER_OFFLINE"

export interface ExecutionResult {
  raw?: unknown
  bindings?: Record<string, unknown>[]
}

export interface ExecutionError {
  message: string
  detail?: string
  isNetworkError: boolean
  isCorsError: boolean
  isTimeout: boolean
}

export interface HttpExampleProps {
  method: string
  path: string
  headers?: string
  fixture?: string
  id?: string
  runnable?: boolean
  expect?: string
  children?: string
}
