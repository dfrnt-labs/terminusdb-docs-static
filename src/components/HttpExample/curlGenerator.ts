/**
 * Pure function that generates a curl command string from structured HTTP request data.
 * Used by CurlView for display and by the Copy button for clipboard content.
 */

interface CurlGeneratorInput {
  method: string
  path: string
  headers: Record<string, string>
  body?: string
  serverUrl: string
  user: string
  password: string
}

/**
 * Generates a curl command string from structured data.
 *
 * Rules (from spec §2):
 * - Always starts with: `curl -s`
 * - Auth: `-u {user}:{password}`
 * - Method: `-X {METHOD}` (omitted for GET)
 * - URL: `"{serverUrl}{path}"` (always quoted)
 * - Headers: `-H "{Key}: {Value}"` for each extra header
 * - Content-Type: auto-injected if body present and not already in headers
 * - Body: `-d '{body}'` (single-quoted)
 * - Line breaking: if total > 80 chars, break with `\` continuations + 2-space indent
 * - Body always on new line if present
 * - Body pretty-printed only if > 60 chars
 */
export function generateCurl(input: CurlGeneratorInput): string {
  const { method, path, headers, body, serverUrl, user, password } = input
  const upperMethod = method.toUpperCase()

  // Build the main command line (everything before -H and -d)
  const url = `${serverUrl.replace(/\/+$/, "")}${path}`
  let mainLine = `curl -s -u ${user}:${password}`
  if (upperMethod !== "GET") {
    mainLine += ` -X ${upperMethod}`
  }
  mainLine += ` "${url}"`

  // Collect header flags
  const headerFlags: string[] = []
  for (const [key, value] of Object.entries(headers)) {
    headerFlags.push(`-H "${key}: ${value}"`)
  }
  // Auto-inject Content-Type if body present
  if (body && !Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
    headerFlags.push(`-H "Content-Type: application/json"`)
  }

  // No body, no extra headers: just the main line
  if (!body && headerFlags.length === 0) {
    return mainLine
  }

  // No body but has headers
  if (!body) {
    const singleLine = mainLine + " " + headerFlags.join(" ")
    if (singleLine.length <= 80) {
      return singleLine
    }
    const lines = [mainLine]
    for (const h of headerFlags) {
      lines.push("  " + h)
    }
    return lines.join(" \\\n")
  }

  // Has body — format it
  let bodyFlag: string
  if (body.length > 60) {
    try {
      const parsed = JSON.parse(body)
      const pretty = JSON.stringify(parsed, null, 2)
      // Indent continuation lines by 2 spaces (matches standard curl formatting)
      const indented = pretty.split("\n").map((line, i) => (i === 0 ? line : "  " + line)).join("\n")
      bodyFlag = `-d '${indented}'`
    } catch {
      bodyFlag = `-d '${body}'`
    }
  } else {
    bodyFlag = `-d '${body}'`
  }

  // Check if everything fits on one line (unlikely with body, but check)
  const allParts = [mainLine, ...headerFlags, bodyFlag]
  const singleLine = allParts.join(" ")
  if (singleLine.length <= 80) {
    return singleLine
  }

  // Multi-line format: main line, then headers, then body each on continuation lines
  const lines = [mainLine]
  for (const h of headerFlags) {
    lines.push("  " + h)
  }
  lines.push("  " + bodyFlag)
  return lines.join(" \\\n")
}
