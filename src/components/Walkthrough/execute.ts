import { parseCurlToFetch, extractUrlPath } from "../RunnableFence/parseCurl"
import { resolvePath, unwrapBindingRow } from "../HttpExample"
import { evalWoqlCode } from "../WoqlPlayground"
import type { StepRequestDescriptor } from "./context"
import type { ExecutionResult, ExecutionError } from "../RunnableFence/types"

// ---------------------------------------------------------------------------
// resolveRequest — turn a descriptor into a concrete fetch request.
// Slot substitution happens here (consumer placeholders are filled with the
// current slot value at run time, like Fence's displayCode substitution).
// ---------------------------------------------------------------------------

export interface ResolvedRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
  /** Skip the Authorization header (anonymous endpoints like /api/woql) */
  noAuth?: boolean
}

interface ConnectionSettings {
  serverUrl: string
  user: string
  password: string
  db: string
}

export function substituteSlotValue(code: string, slot: string | undefined, placeholder: string | undefined, value: string | undefined): string {
  if (!slot || !placeholder || !value) return code
  return code.replace(new RegExp(placeholder, "g"), value)
}

export function consumerBlocked(req: StepRequestDescriptor, slotValue: string | undefined): boolean {
  return Boolean(req.slot && req.placeholder && !slotValue)
}

/**
 * If the request creates a database — `POST /api/db/<org>/<db>` or
 * `POST /api/clone/<org>/<db>` — returns the URL a DELETE would remove;
 * used by the "database already exists" retry flow.
 */
export function dbCreateUrl(
  req: StepRequestDescriptor,
  settings: ConnectionSettings,
  slotValue: string | undefined
): string | null {
  const resolved = resolveRequest(req, settings, slotValue)
  if (!resolved || resolved.method !== "POST") return null
  if (/\/api\/db\/[^/?]+\/[^/?]+/.test(resolved.url)) return resolved.url
  if (/\/api\/clone\/[^/?]+\/[^/?]+/.test(resolved.url)) {
    return resolved.url.replace("/api/clone/", "/api/db/")
  }
  return null
}

export function isDbExistsError(error: ExecutionError | null | undefined): boolean {
  return Boolean(error && !error.isNetworkError && !error.isCorsError && /exists/i.test(error.message))
}

export async function deleteDatabase(url: string, settings: ConnectionSettings, signal?: AbortSignal): Promise<void> {
  await fetch(url, {
    method: "DELETE",
    headers: { Authorization: "Basic " + btoa(`${settings.user}:${settings.password}`) },
    signal,
  }).catch(() => {})
}

export function resolveRequest(
  req: StepRequestDescriptor,
  settings: ConnectionSettings,
  slotValue: string | undefined
): ResolvedRequest | null {
  const baseUrl = settings.serverUrl.replace(/\/+$/, "")

  if (req.kind === "woql") {
    if (!req.code?.trim()) return null
    const body = woqlRequestBody(req, settings)
    if (!body) return null
    const db = req.database || "_system"
    const url = req.anonymous
      ? `${baseUrl}/api/woql`
      : db === "_system"
        ? `${baseUrl}/api/woql/_system`
        : `${baseUrl}/api/woql/${settings.user}/${db}/local/branch/main`
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    return {
      method: "POST",
      url,
      headers,
      noAuth: req.anonymous,
      body,
    }
  }

  if (req.kind === "http-example") {
    const path = resolvePath(req.path || "", settings.user, settings.db)
    return {
      method: (req.method || "GET").toUpperCase(),
      url: `${baseUrl}${path}`,
      headers: { ...(req.headers || {}) },
      body: req.body,
    }
  }

  // curl kind — parse the (slot-substituted) bash source
  const code = substituteSlotValue(req.code || "", req.slot, req.placeholder, slotValue)
  const parsed = parseCurlToFetch(code.trim())
  if (!parsed) return null

  const isTerminusDbUrl = /(?:localhost|127\.0\.0\.1):6363/.test(parsed.url) ||
    /\$\{?TERMINUSDB_URL\}?/.test(parsed.url) ||
    parsed.url.startsWith(baseUrl) ||
    /(?:localhost|127\.0\.0\.1):\d+\/api\//.test(parsed.url)

  const shouldRewriteUrl = isTerminusDbUrl &&
    (/(?:localhost|127\.0\.0\.1):6363/.test(parsed.url) ||
      /\$\{?TERMINUSDB_URL\}?/.test(parsed.url) ||
      parsed.url.startsWith(baseUrl))

  const url = shouldRewriteUrl ? `${baseUrl}${extractUrlPath(parsed.url)}` : parsed.url
  const headers: Record<string, string> = { ...parsed.headers }
  if (parsed.body && !Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json"
  }

  return { method: parsed.method.toUpperCase(), url, headers, body: parsed.body }
}

/** The real POST body a WOQL request sends — the JSON-LD AST the HTTP tab shows */
export function woqlRequestBody(
  req: StepRequestDescriptor,
  settings: { user: string }
): string | undefined {
  try {
    return JSON.stringify({
      query: evalWoqlCode(req.code || ""),
      all_witnesses: true,
      commit_info: { author: settings.user, message: "Docs walkthrough query" },
    })
  } catch {
    return undefined
  }
}

// ---------------------------------------------------------------------------
// shapeResultBody — response text → ExecutionResult (bindings extraction
// mirrors HttpExample.executeRequest's post-processing)
// ---------------------------------------------------------------------------

export function shapeResultBody(text: string): ExecutionResult {
  let resultData: unknown
  try {
    resultData = JSON.parse(text)
  } catch {
    resultData = text
  }

  const execResult: ExecutionResult = { raw: resultData }

  if (resultData && typeof resultData === "object" && !Array.isArray(resultData)) {
    const obj = resultData as Record<string, unknown>
    if (Array.isArray(obj["bindings"])) {
      execResult.bindings = (obj["bindings"] as Record<string, unknown>[]).map(unwrapBindingRow)
    }
  } else if (Array.isArray(resultData) && resultData.length > 0 && typeof resultData[0] === "object" && resultData[0] !== null) {
    execResult.bindings = (resultData as Record<string, unknown>[]).map(unwrapBindingRow)
  }

  // Schema document list — show @id when result is a schema listing
  if (Array.isArray(resultData)) {
    const schemaItems = (resultData as Record<string, unknown>[]).filter(
      (d) => d["@id"] && d["@type"] === "Class"
    )
    if (schemaItems.length > 0 && schemaItems.length === (resultData as unknown[]).length) {
      execResult.bindings = schemaItems.map((d) => ({ Class: d["@id"] as string }))
    }
  }

  return execResult
}

// ---------------------------------------------------------------------------
// executeLive — fetch against the configured server
// ---------------------------------------------------------------------------

export async function executeLive(
  resolved: ResolvedRequest,
  req: StepRequestDescriptor,
  settings: ConnectionSettings,
  signal: AbortSignal
): Promise<{ result?: ExecutionResult; error?: ExecutionError }> {
  const baseUrl = settings.serverUrl.replace(/\/+$/, "")
  const authHeader = "Basic " + btoa(`${settings.user}:${settings.password}`)

  try {
    // Fixture handling — same contract as HttpExample: delete the target db first
    if (req.fixture) {
      const pathMatch = resolved.url.match(/\/api\/db\/([^/?]+\/[^/?]+)/)
      const dbPath = pathMatch ? pathMatch[1] : `${settings.user}/${req.fixture}`
      await fetch(`${baseUrl}/api/db/${dbPath}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
        signal,
      }).catch(() => {})
    }

    const headers: Record<string, string> = {
      ...(resolved.noAuth ? {} : { Authorization: authHeader }),
      ...resolved.headers,
    }
    if (resolved.body && !Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json"
    }

    const response = await fetch(resolved.url, {
      method: resolved.method,
      headers,
      body: resolved.body,
      signal,
    })
    const text = await response.text()

    if (!response.ok) {
      let msg = `HTTP ${response.status}: ${response.statusText}`
      let detail: string | undefined
      try {
        const errJson = JSON.parse(text)
        if (errJson["api:message"]) msg = errJson["api:message"]
        else if (errJson.message) msg = errJson.message
        detail = JSON.stringify(errJson, null, 2)
      } catch {
        detail = text.slice(0, 2000) || undefined
      }
      return { error: { message: msg, detail, isNetworkError: false, isCorsError: false, isTimeout: false } }
    }

    return { result: shapeResultBody(text) }
  } catch (e: unknown) {
    if (signal.aborted) return {}
    const err = e instanceof Error ? e : new Error(String(e))
    const isTimeout = err.name === "AbortError"
    const isNetworkError = err.message?.includes("Failed to fetch") ||
      err.message?.includes("NetworkError") ||
      err.message?.includes("ERR_CONNECTION_REFUSED")
    const isCorsError = err.message?.includes("CORS") || err.message?.includes("blocked")

    if (isTimeout) {
      return { error: { message: "Request timed out after 15 seconds. Is the server responding?", isNetworkError: false, isCorsError: false, isTimeout: true } }
    }
    if (isCorsError || isNetworkError) {
      return {
        error: {
          message: isCorsError ? "Connection blocked. Ensure your TerminusDB server has CORS enabled." : err.message,
          isNetworkError: !isCorsError,
          isCorsError,
          isTimeout: false,
        },
      }
    }
    return { error: { message: err.message || String(e), isNetworkError: false, isCorsError: false, isTimeout: false } }
  }
}

// ---------------------------------------------------------------------------
// simulate — canned response after a short fake latency; feeds the same
// ExecutionResult shape so ResultPanel and slot publishing work unchanged
// ---------------------------------------------------------------------------

const SIMULATED_DELAY_MS = 350

export async function simulate(req: StepRequestDescriptor, signal: AbortSignal): Promise<ExecutionResult | null> {
  await new Promise((r) => setTimeout(r, SIMULATED_DELAY_MS))
  if (signal.aborted) return null
  if (!req.expected || !req.expected.trim()) {
    return { raw: { message: "No canned response for this step." }, simulated: true }
  }
  return { ...shapeResultBody(req.expected.trim()), simulated: true }
}
