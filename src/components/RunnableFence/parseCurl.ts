/**
 * Parses a curl command string into structured HTTP request components.
 * Used by both RunnableFence (runnable blocks) and Fence (passive tabs).
 */

export interface ParsedCurl {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
  /** Raw user:pass from -u flag, if present. Used to generate Authorization header. */
  userCredentials?: string
}

export function parseCurlToFetch(code: string): ParsedCurl | null {
  // Strip line continuations (backslash + newline) and collapse to single line
  const cmd = code.replace(/\\\s*\n\s*/g, " ").trim()

  // Must start with "curl" (ignore leading comments/blank lines)
  const lines = cmd.split("\n")
  const curlLineIdx = lines.findIndex((l) => l.trim().startsWith("curl"))
  if (curlLineIdx === -1) return null

  // Join from the curl line onwards, preserving newlines for multi-line bodies
  // (e.g. NDJSON with multiple JSON lines inside single quotes).
  // Option regexes (-X, -H, -u, -d) all use \s+ which matches \n, so they still work.
  const normalized = lines.slice(curlLineIdx).join("\n").trim()

  // Reject commands that pipe to other shell commands — they can't run in the browser.
  // Match | that is not inside quotes (simple heuristic: check the first line for a pipe
  // outside of single/double quotes).
  const firstLine = normalized.split("\n")[0]
  const pipeOutsideQuotes = firstLine.replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "").includes("|")
  if (pipeOutsideQuotes) return null

  // Extract -X METHOD (default: GET, or POST if -d is present)
  const methodMatch = normalized.match(/-X\s+(\w+)/)

  // Extract all -H "Key: Value" headers
  const headerMatches = [...normalized.matchAll(/-H\s+(?:"([^"]+)"|'([^']+)')/g)]
  const headers: Record<string, string> = {}
  for (const m of headerMatches) {
    const headerStr = m[1] || m[2]
    const colonIdx = headerStr.indexOf(":")
    if (colonIdx > 0) {
      const key = headerStr.slice(0, colonIdx).trim()
      const value = headerStr.slice(colonIdx + 1).trim()
      headers[key] = value
    }
  }

  // Extract -u user:pass credentials
  // The raw credentials are stored on ParsedCurl; the Authorization header is generated
  // at display/copy time using btoa() in the browser context.
  const userMatch = normalized.match(/-u\s+(?:"([^"]+)"|'([^']+)'|(\S+))/)
  const userCredentials = userMatch ? (userMatch[1] || userMatch[2] || userMatch[3]) : undefined

  // Extract -d or --data body (single or double quoted, may span multiple lines)
  const bodyMatch = normalized.match(/(?:-d|--data)\s+(?:"((?:[^"\\]|\\.)*)"|'([\s\S]*?)')/)
  let body: string | undefined
  if (bodyMatch) {
    body = bodyMatch[1] !== undefined
      ? bodyMatch[1].replace(/\\"/g, "\"").replace(/\\\\/g, "\\")
      : bodyMatch[2]?.trim()
  }

  // Determine method
  let method = "GET"
  if (methodMatch) {
    method = methodMatch[1].toUpperCase()
  } else if (body !== undefined) {
    method = "POST"
  }

  // Extract URL — the first thing that looks like a URL (http/https) or last bare argument
  const urlMatch = normalized.match(/(?:"|')?(https?:\/\/[^\s"']+)(?:"|')?/)
  if (!urlMatch) return null
  const url = urlMatch[1]

  // Reject when URL or headers contain shell variables — they cannot be substituted in the browser.
  // Note: body is NOT checked — $id in a GraphQL query or NDJSON is literal content, not a shell var.
  const hasShellVar = /\$[{(]?[A-Za-z_]/
  if (hasShellVar.test(url)) return null
  if (userCredentials !== undefined && hasShellVar.test(userCredentials)) return null
  for (const value of Object.values(headers)) {
    if (hasShellVar.test(value)) return null
  }

  return { url, method, headers, body, userCredentials }
}

/**
 * Extracts the path portion from a full URL, stripping the origin.
 * e.g. "http://localhost:6363/api/db/admin/MyDatabase" → "/api/db/admin/MyDatabase"
 */
export function extractUrlPath(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  } catch {
    // If URL parsing fails, return as-is
    return url
  }
}

/**
 * Generates a Basic auth header from user credentials string ("user:pass").
 * Returns the full "Basic <base64>" string. Works in browser only (uses btoa).
 */
export function generateAuthHeader(userCredentials: string): string {
  if (typeof btoa === "function") {
    return "Basic " + btoa(userCredentials)
  }
  // Fallback for SSR — should not be called server-side in practice
  return "Basic " + Buffer.from(userCredentials).toString("base64")
}

/**
 * Formats a ParsedCurl object into standard HTTP/1.1 message format for clipboard copy.
 * Auth values are NOT masked — used for copy action where user explicitly requests full content.
 */
export function formatHttpMessage(parsed: ParsedCurl, authHeader?: string): string {
  const path = extractUrlPath(parsed.url)
  const lines: string[] = [`${parsed.method} ${path}`]

  // Add headers
  const allHeaders = { ...parsed.headers }
  if (authHeader) {
    allHeaders["Authorization"] = authHeader
  } else if (parsed.userCredentials && !Object.keys(allHeaders).some((k) => k.toLowerCase() === "authorization")) {
    allHeaders["Authorization"] = generateAuthHeader(parsed.userCredentials)
  }

  for (const [key, value] of Object.entries(allHeaders)) {
    lines.push(`${key}: ${value}`)
  }

  // Blank line before body
  if (parsed.body) {
    lines.push("")
    lines.push(parsed.body)
  }

  return lines.join("\n")
}
