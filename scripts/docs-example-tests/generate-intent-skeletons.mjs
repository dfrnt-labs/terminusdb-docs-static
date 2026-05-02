#!/usr/bin/env node

/**
 * generate-intent-skeletons.mjs — Intent skeleton generator for documentation code blocks.
 *
 * Parses all page.md files under src/app/docs/, extracts every code block,
 * and generates per-page YAML intent skeleton files in intent/ folder.
 *
 * Auto-fills:
 *   - language, block_index (from Markdoc parsing)
 *   - depends_on (sequential within page)
 *   - skip_reason (auto-detect JSON display, config, pseudocode)
 *   - expected_outcome (from http-expected sibling blocks)
 *   - action (from http-example method + path)
 *
 * Usage:
 *   node scripts/docs-example-tests/generate-intent-skeletons.mjs
 *   node scripts/docs-example-tests/generate-intent-skeletons.mjs --dry-run
 *   node scripts/docs-example-tests/generate-intent-skeletons.mjs --page <slug>
 *   node scripts/docs-example-tests/generate-intent-skeletons.mjs --stats
 *
 * Output:
 *   intent/<page-slug>.yaml — one file per page with code blocks
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const REPO_ROOT = join(__dirname, "../..")
const DOCS_DIR = join(REPO_ROOT, "src/app/docs")
const INTENT_DIR = join(REPO_ROOT, "intent")

// ── CLI flags ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const statsOnly = args.includes("--stats")
const pageFilter = args.includes("--page")
  ? args[args.indexOf("--page") + 1]
  : null

if (pageFilter && !pageFilter) {
  console.error("Error: --page requires a slug argument")
  process.exit(1)
}

// ── File collection ─────────────────────────────────────────────────────────

function collectMarkdownFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath))
    } else if (entry === "page.md") {
      results.push(fullPath)
    }
  }
  return results.sort()
}

// ── Block extraction (enhanced from coverage-audit.mjs) ─────────────────────

/**
 * Skip reason detection patterns.
 */
const CONFIG_LANGUAGES = new Set(["yaml", "yml", "toml", "ini", "env", "dockerfile"])
const DISPLAY_LANGUAGES = new Set(["text", "plaintext", "txt", "csv", "log", "diff", "mermaid", "xml", "html", "css", "sql", "markdown", "md"])
const PSEUDOCODE_LANGUAGES = new Set(["pseudocode", "pseudo", "algorithm"])

/**
 * Detect if a JSON block is display-only (not executable).
 * Heuristics:
 *   - Contains schema definitions (@type, @context)
 *   - Is an expected response body (inside http-expected)
 *   - Contains comments or annotations
 *   - Is a WOQL AST (JSON representation of a query)
 */
function isJsonDisplayOnly(content, context) {
  // If it's inside an http-expected block, it's a response example
  if (context.insideHttpExpected) return true
  // If it's a WOQL AST (the JSON body for POST /api/woql)
  if (content.includes('"@type": "And"') || content.includes('"@type": "Triple"') || content.includes('"@type": "Or"')) return true
  // If it's a schema definition
  if (content.includes('"@type": "Class"') || content.includes('"@base"') && content.includes('"@schema"')) return true
  // If it starts with a comment-like annotation
  if (content.trim().startsWith("//")) return true
  return false
}

/**
 * Detect if a bash block is a curl command and extract its action.
 * Returns { action, method, path } or null.
 */
function parseCurlBlock(content) {
  // Match curl commands (possibly multi-line with \)
  const joined = content.replace(/\\\n\s*/g, " ")

  // Must contain curl
  if (!joined.includes("curl")) return null

  // Extract method
  let method = "GET"
  const methodMatch = joined.match(/-X\s*(GET|POST|PUT|DELETE|PATCH|HEAD)/i)
  if (methodMatch) method = methodMatch[1].toUpperCase()
  else if (joined.includes("-d ") || joined.includes("--data") || joined.includes("-d'") || joined.includes('-d"')) method = "POST"

  // Extract URL/path — handle both literal URLs and variable-based URLs
  let path = ""

  // Try literal URL first
  const literalUrlMatch = joined.match(/(https?:\/\/[^\s"']+|\/api\/[^\s"']+)/)
  if (literalUrlMatch) {
    path = literalUrlMatch[1].replace(/https?:\/\/[^\/]+/, "")
  }

  // Try variable-based URL: "${VAR}/api/..." or "$VAR/api/..."
  if (!path) {
    const varUrlMatch = joined.match(/["']\$\{?\w+\}?(\/api\/[^"'\s]+)["']/)
    if (varUrlMatch) {
      path = varUrlMatch[1]
    }
  }

  // Try quoted URL with interpolation
  if (!path) {
    const quotedMatch = joined.match(/["'][^"']*?(\/api\/[^"'\s]*?)["']/)
    if (quotedMatch) {
      path = quotedMatch[1]
    }
  }

  // Even without a parseable path, if curl is present, mark it
  if (!path) {
    path = "(dynamic URL)"
  }

  // Clean up shell variables in path for readability
  const cleanPath = path.replace(/\$\{?\w+\}?/g, "*")

  return { action: `${method} ${cleanPath}`, method, path: cleanPath }
}

/**
 * Detect if a JavaScript/TypeScript block contains a WOQL query pattern.
 * Returns an action description or null.
 */
function detectWoqlPattern(content) {
  // Direct WOQL method calls (SDK client pattern)
  const hasWoqlMethods = content.includes("WOQL.") || content.includes("client.query(") || content.includes("WOQLClient")
  // Inline WOQL patterns (snippet-style: triple(), and(), select(), etc.)
  const hasWoqlInline = /\b(triple|and|or|select|opt|path|order_by|group_by|limit|distinct|eq|not)\s*\(/.test(content)
  // Vars pattern (common in WOQL snippets)
  const hasVars = /\b(Vars|VarsUnique)\s*\(/.test(content)
  // WOQL-specific functions (comprehensive list including comparison, time, arithmetic)
  const hasWoqlFunctions = /\b(literal|typecast|insert_document|delete_document|read_document|update_document|idgen|member|dot|concat|length|greater|less|timestamp_now|triple_slice|interval|duration|gte|lte|in_range|date_add|date_sub|duration_between|format_date|parse_date|now|minus|plus|times|divide|floor|abs|power|exp|eval|sum|count|aggregate|pad|split|upper|lower|like|regexp|starts_with|size|sub_string|re)\s*\(/.test(content)
  // Strong WOQL indicator: literal() with xsd: types
  const hasLiteralXsd = /literal\s*\([^)]*"xsd:/.test(content)

  // Also detect: multiple WOQL inline functions used together (strong signal even without Vars)
  const woqlInlineCount = (content.match(/\b(triple|and|or|select|opt|path|order_by|group_by|limit|distinct|eq|not)\s*\(/g) || []).length
  const woqlFuncCount = (content.match(/\b(literal|typecast|insert_document|delete_document|read_document|update_document|idgen|member|dot|concat|length|greater|less|timestamp_now|triple_slice|interval|duration|gte|lte|in_range|date_add|date_sub|duration_between|format_date|parse_date|now|minus|plus|times|divide|floor|abs|power|exp|eval|sum|count|aggregate|pad|split|upper|lower|like|regexp|starts_with|size|sub_string|re)\s*\(/g) || []).length
  const totalWoqlSignals = woqlInlineCount + woqlFuncCount

  if (hasWoqlMethods || ((hasWoqlInline || hasWoqlFunctions) && (hasVars || content.includes("v."))) || (hasWoqlFunctions && hasLiteralXsd) || totalWoqlSignals >= 2) {
    // Try to detect what the WOQL query does
    if (content.includes("addDocument") || content.includes("add_document") || content.includes("insert_document")) return "Insert document via WOQL"
    if (content.includes("updateDocument") || content.includes("update_document") || content.includes("update_triple")) return "Update document via WOQL"
    if (content.includes("deleteDocument") || content.includes("delete_document") || content.includes("delete_triple")) return "Delete document via WOQL"
    if (content.includes("getDocument") || content.includes("get_document") || content.includes("read_document")) return "Retrieve document via WOQL"
    if (content.includes("getSchema") || content.includes("get_schema")) return "Retrieve schema via SDK"
    if (content.includes("addSchema") || content.includes("add_schema")) return "Add schema via SDK"
    if (content.includes("branch") || content.includes("createBranch")) return "Branch operation via SDK"
    if (content.includes("clone")) return "Clone database via SDK"
    if (content.includes("triple") && content.includes("query")) return "Execute WOQL query (SDK)"
    if (hasWoqlFunctions || hasWoqlInline) return "WOQL query snippet"
    return "WOQL query via SDK"
  }
  return null
}

/**
 * Detect if a JavaScript/TypeScript block is an SDK client operation.
 * Returns an action description or null.
 */
function detectSdkPattern(content) {
  // TerminusDB client patterns
  if (content.includes("WOQLClient") || content.includes("TerminusClient")) {
    if (content.includes("connect(")) return "Connect to TerminusDB via SDK"
    if (content.includes("createDatabase") || content.includes("create_database")) return "Create database via SDK"
    if (content.includes("deleteDatabase") || content.includes("delete_database")) return "Delete database via SDK"
    return "TerminusDB SDK operation"
  }

  // AccessControl SDK patterns
  if (content.includes("accessControl.") || content.includes("AccessControl")) {
    if (content.includes("createOrganization")) return "Create organization via SDK"
    if (content.includes("deleteOrganization")) return "Delete organization via SDK"
    if (content.includes("createRole")) return "Create role via SDK"
    if (content.includes("deleteRole")) return "Delete role via SDK"
    if (content.includes("createUser") || content.includes("addUser")) return "Create user via SDK"
    if (content.includes("deleteUser") || content.includes("removeUser")) return "Delete user via SDK"
    if (content.includes("getCapability") || content.includes("manageCapability")) return "Manage capability via SDK"
    if (content.includes("getAllOrganizations") || content.includes("getOrganization")) return "List organizations via SDK"
    if (content.includes("getAllUsers") || content.includes("getUser")) return "List users via SDK"
    if (content.includes("getRoles") || content.includes("getAllRoles")) return "List roles via SDK"
    return "Access control operation via SDK"
  }

  // Generic client.* method calls (TerminusDB JS client)
  if (content.includes("client.") && (
    content.includes("client.addDocument") ||
    content.includes("client.getDocument") ||
    content.includes("client.updateDocument") ||
    content.includes("client.deleteDocument") ||
    content.includes("client.getSchema") ||
    content.includes("client.addSchema") ||
    content.includes("client.branch") ||
    content.includes("client.rebase") ||
    content.includes("client.reset") ||
    content.includes("client.squash") ||
    content.includes("client.clone") ||
    content.includes("client.pull") ||
    content.includes("client.push") ||
    content.includes("client.fetch")
  )) {
    if (content.includes("addDocument")) return "Insert document via SDK"
    if (content.includes("getDocument")) return "Retrieve document via SDK"
    if (content.includes("updateDocument")) return "Update document via SDK"
    if (content.includes("deleteDocument")) return "Delete document via SDK"
    if (content.includes("getSchema")) return "Get schema via SDK"
    if (content.includes("addSchema")) return "Add schema via SDK"
    if (content.includes("branch")) return "Branch operation via SDK"
    if (content.includes("clone")) return "Clone via SDK"
    return "TerminusDB client operation"
  }

  // Python client
  if (content.includes("from terminusdb_client") || content.includes("import terminusdb_client") || content.includes("WOQLClient(")) {
    if (content.includes("WOQLQuery") || content.includes("WOQL")) return "WOQL query via Python SDK"
    if (content.includes("connect(")) return "Connect to TerminusDB via Python SDK"
    if (content.includes("add_document")) return "Insert document via Python SDK"
    if (content.includes("get_document")) return "Retrieve document via Python SDK"
    if (content.includes("update_document")) return "Update document via Python SDK"
    if (content.includes("delete_document")) return "Delete document via Python SDK"
    return "TerminusDB Python SDK operation"
  }

  // Python requests-based access control
  if (content.includes("requests.") && (content.includes("/api/") || content.includes("terminusdb"))) {
    return "TerminusDB API call via Python requests"
  }

  return null
}

/**
 * Detect if a JSON block is a request body (typically shown before/with curl or http-example).
 * Returns a classification string or null.
 */
function classifyJsonBlock(content) {
  const trimmed = content.trim()

  // WOQL AST body
  if (trimmed.includes('"@type"') && (trimmed.includes('"And"') || trimmed.includes('"Triple"') || trimmed.includes('"Or"') || trimmed.includes('"Select"') || trimmed.includes('"NodeValue"'))) {
    return "woql_ast"
  }

  // Schema definition
  if (trimmed.includes('"@type": "Class"') || trimmed.includes('"@type":"Class"')) {
    return "schema_definition"
  }

  // Context definition
  if (trimmed.includes('"@base"') || trimmed.includes('"@schema"') || trimmed.includes('"@type": "Context"') || trimmed.includes('"@type":"Context"')) {
    return "context_definition"
  }

  // Diff patch
  if (trimmed.includes('"@op"') || trimmed.includes('"SwapValue"') || trimmed.includes('"InsertList"')) {
    return "diff_patch"
  }

  // API response (common patterns)
  if (trimmed.includes('"api:status"') || trimmed.includes('"api:success"')) {
    return "api_response"
  }

  // Single string value (response like "terminusdb://...")
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && !trimmed.includes("\n")) {
    return "string_response"
  }

  // Document instance (has @id and @type but not Class)
  if (trimmed.includes('"@id"') && trimmed.includes('"@type"')) {
    return "document_instance"
  }

  // Array of strings (like document IDs)
  if (trimmed.startsWith("[") && trimmed.includes('"terminusdb:///')) {
    return "document_ids"
  }

  // Array of objects (likely a response)
  if (trimmed.startsWith("[") && trimmed.includes("{")) {
    return "array_response"
  }

  // Object with typical response shape (no @type, no @id — just data)
  if (trimmed.startsWith("{") && !trimmed.includes('"@type"') && !trimmed.includes('"@id"')) {
    // Could be request body or response — if small and flat, likely response example
    if (trimmed.length < 200) return "json_response_example"
  }

  return null
}

/**
 * Detect skip reason for a code block.
 */
function detectSkipReason(block) {
  const lang = block.language
  const content = block.content

  if (PSEUDOCODE_LANGUAGES.has(lang)) return "pseudocode"
  if (CONFIG_LANGUAGES.has(lang)) return "config_only"
  if (DISPLAY_LANGUAGES.has(lang)) return "display_only"

  // JSON that's display-only
  if (lang === "json" && block.isDisplayJson) return "display_only"

  // Blocks that are inside http-expected (they are assertion targets, not executable)
  if (block.isHttpExpectedContent) return "expected_response"

  // WOQL AST blocks (the raw JSON body shown alongside TypeScript)
  if (block.isWoqlAst) return "woql_ast_display"

  // Prolog, turtle, RDF — not directly executable in our test infra
  if (["prolog", "turtle", "rdf", "cypher", "rust", "handlebars", "jsx"].includes(lang)) return "no_test_runner"

  // JSON blocks: classify further
  if (lang === "json") {
    const classification = classifyJsonBlock(content)
    if (classification === "woql_ast") return "woql_ast_display"
    if (classification === "context_definition") return "display_only"
    if (classification === "api_response") return "display_only"
    if (classification === "diff_patch") return "display_only"
    if (classification === "string_response") return "display_only"
    if (classification === "document_ids") return "display_only"
    if (classification === "array_response") return "display_only"
    if (classification === "json_response_example") return "display_only"
    // schema_definition and document_instance are potentially testable, don't skip
  }

  // GraphQL — queries are executable
  if (lang === "graphql" || lang === "gql") return null

  // "unknown" language — likely display
  if (lang === "unknown") return "display_only"

  // url language
  if (lang === "url") return "display_only"

  // "woql" and "woql ast" labeled blocks
  if (lang === "woql ast") return "woql_ast_display"

  return null
}

/**
 * Infer action for fenced code blocks based on content patterns.
 * Returns an action string or null (needs manual annotation).
 */
function inferFencedBlockAction(block) {
  const lang = block.language
  const content = block.content

  // Bash/shell blocks: detect curl patterns
  if (["bash", "sh", "shell", "curl"].includes(lang)) {
    const curlInfo = parseCurlBlock(content)
    if (curlInfo) return curlInfo.action

    // Docker commands
    if (content.includes("docker ")) {
      if (content.includes("docker run")) return "Start Docker container"
      if (content.includes("docker pull")) return "Pull Docker image"
      if (content.includes("docker-compose") || content.includes("docker compose")) return "Docker Compose operation"
      return "Docker operation"
    }

    // npm/node commands
    if (content.includes("npm ")) return "npm operation"
    if (content.includes("node ")) return "Node.js script execution"

    // git commands
    if (content.includes("git ")) return "Git operation"

    // pip/python
    if (content.includes("pip install")) return "Install Python package"

    // Generic install/setup
    if (content.includes("install")) return "Install dependency"

    // Environment variable setup (export/set commands only, no actual execution)
    const lines = content.trim().split("\n").filter(l => !l.startsWith("#"))
    const allExports = lines.every(l => l.trim().startsWith("export ") || l.trim().startsWith("set ") || l.trim() === "" || l.includes("="))
    if (allExports && lines.length > 0) return "Set environment variables"

    return null
  }

  // JavaScript/TypeScript blocks
  if (["javascript", "js", "typescript", "ts", "typescript / node.js"].includes(lang)) {
    // Detect JSON-like content mislabeled as JS/TS (common in schema/migration docs)
    const trimmed = content.trim()
    if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && trimmed.includes('"@type"')) {
      // This is actually a JSON payload shown as TS/JS
      if (trimmed.includes('"DeleteClass"') || trimmed.includes('"CreateClass"') || trimmed.includes('"MoveClass"') || trimmed.includes('"ChangeKey"') || trimmed.includes('"ChangeParents"')) {
        return "Schema migration operation"
      }
      if (trimmed.includes('"Class"')) return "Schema type definition"
      return "JSON document payload"
    }

    const woqlAction = detectWoqlPattern(content)
    if (woqlAction) return woqlAction

    const sdkAction = detectSdkPattern(content)
    if (sdkAction) return sdkAction

    // fetch/axios patterns
    if (content.includes("fetch(") || content.includes("axios.")) {
      const methodMatch = content.match(/method:\s*["'](GET|POST|PUT|DELETE|PATCH)["']/i)
      return methodMatch
        ? `HTTP ${methodMatch[1].toUpperCase()} via fetch/axios`
        : "HTTP request via fetch/axios"
    }

    return null
  }

  // Python blocks
  if (["python", "py"].includes(lang)) {
    const sdkAction = detectSdkPattern(content)
    if (sdkAction) return sdkAction

    if (content.includes("requests.")) {
      const methodMatch = content.match(/requests\.(get|post|put|delete|patch)\(/i)
      return methodMatch
        ? `HTTP ${methodMatch[1].toUpperCase()} via Python requests`
        : "HTTP request via Python"
    }

    return null
  }

  // JSON blocks that aren't skipped
  if (lang === "json") {
    const classification = classifyJsonBlock(content)
    if (classification === "schema_definition") return "Define schema type"
    if (classification === "document_instance") return "Document instance (request body)"
    if (classification === "document_ids") return "Document ID list (response)"
    return null
  }

  // WOQL-labeled blocks
  if (lang === "woql") return "WOQL query"

  // GraphQL
  if (lang === "graphql" || lang === "gql") return "GraphQL query"

  return null
}

/**
 * Extract all code blocks from a page.md file with full context.
 *
 * Returns array of:
 *   { language, content, line, type, method, path, httpExpected, isDisplayJson,
 *     isHttpExpectedContent, isWoqlAst, runnable }
 */
function extractBlocksWithContext(filePath) {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const blocks = []

  // Track context: are we inside http-example, http-expected, http-woql?
  let insideHttpExample = false
  let insideHttpExpected = false
  let insideHttpWoql = false
  let currentHttpMethod = ""
  let currentHttpPath = ""
  let currentHttpExpectedContent = ""
  let httpExampleStartLine = -1

  // State machine for multi-pass extraction
  // Pass 1: Extract http-example blocks with their children
  const httpExamplePattern = /\{%\s*http-example\s+((?:[^%]|%(?!\}))*?)(\/?)\s*%\}/g
  const httpExpectedStartPattern = /\{%\s*http-expected\s*%\}/
  const httpExpectedEndPattern = /\{%\s*\/http-expected\s*%\}/
  const httpWoqlStartPattern = /\{%\s*http-woql\s*%\}/
  const httpWoqlEndPattern = /\{%\s*\/http-woql\s*%\}/
  const httpExampleEndPattern = /\{%\s*\/http-example\s*%\}/
  const selfClosingHttpExample = /\{%\s*http-example\s+((?:[^%]|%(?!\}))*?)\/%\}/

  // Regions: track which lines are inside http-example blocks
  const httpExampleRegions = [] // [{start, end, method, path, expected, selfClosing}]
  const httpExpectedRegions = [] // [{start, end, content}]
  const httpWoqlRegions = [] // [{start, end}]

  // Find all http-example regions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Self-closing http-example (no body, no children)
    const selfMatch = line.match(selfClosingHttpExample)
    if (selfMatch && !insideHttpExample) {
      const attrStr = selfMatch[1]
      const method = attrStr.match(/method="([^"]+)"/)?.[1] || "GET"
      const path = attrStr.match(/path="([^"]+)"/)?.[1] || ""
      const runnable = !attrStr.includes("runnable=false")
      httpExampleRegions.push({
        start: i,
        end: i,
        method,
        path,
        expected: null,
        selfClosing: true,
        runnable,
      })
      continue
    }

    // Opening http-example tag
    const openMatch = line.match(/\{%\s*http-example\s+((?:[^%]|%(?!\}))*?)%\}/)
    if (openMatch && !line.match(/\/%\}/) && !insideHttpExample) {
      insideHttpExample = true
      const attrStr = openMatch[1]
      currentHttpMethod = attrStr.match(/method="([^"]+)"/)?.[1] || "GET"
      currentHttpPath = attrStr.match(/path="([^"]+)"/)?.[1] || ""
      httpExampleStartLine = i
      currentHttpExpectedContent = ""
      continue
    }

    // http-expected open/close
    if (insideHttpExample && httpExpectedStartPattern.test(line)) {
      insideHttpExpected = true
      continue
    }
    if (insideHttpExpected && httpExpectedEndPattern.test(line)) {
      insideHttpExpected = false
      httpExpectedRegions.push({
        start: i,
        end: i,
        content: currentHttpExpectedContent.trim(),
        parentStart: httpExampleStartLine,
      })
      continue
    }
    if (insideHttpExpected) {
      currentHttpExpectedContent += line + "\n"
      continue
    }

    // http-woql open/close
    if (insideHttpExample && httpWoqlStartPattern.test(line)) {
      insideHttpWoql = true
      httpWoqlRegions.push({ start: i, end: -1, parentStart: httpExampleStartLine })
      continue
    }
    if (insideHttpWoql && httpWoqlEndPattern.test(line)) {
      insideHttpWoql = false
      httpWoqlRegions[httpWoqlRegions.length - 1].end = i
      continue
    }

    // Closing http-example tag
    if (insideHttpExample && httpExampleEndPattern.test(line)) {
      const runnable = true // non-self-closing are runnable by default
      const expectedContent = httpExpectedRegions
        .filter(r => r.parentStart === httpExampleStartLine)
        .map(r => r.content)
        .join("\n") || null

      httpExampleRegions.push({
        start: httpExampleStartLine,
        end: i,
        method: currentHttpMethod,
        path: currentHttpPath,
        expected: expectedContent,
        selfClosing: false,
        runnable,
      })
      insideHttpExample = false
      continue
    }
  }

  // Pass 2: Extract http-example blocks as intent entries
  for (const region of httpExampleRegions) {
    blocks.push({
      language: "http",
      content: `${region.method} ${region.path}`,
      line: region.start + 1,
      type: "http-example",
      method: region.method,
      path: region.path,
      httpExpected: region.expected,
      isDisplayJson: false,
      isHttpExpectedContent: false,
      isWoqlAst: false,
      runnable: region.runnable,
      selfClosing: region.selfClosing,
    })
  }

  // Pass 3: Extract fenced code blocks (``` ... ```)
  // Note: language group uses [\w/ .] to allow "typescript / node.js" but NOT \n
  const fencedPattern = /^(`{3,})([\w][\w /.]*)?[^\n]*\n([\s\S]*?)^\1\s*$/gm
  let match
  while ((match = fencedPattern.exec(content)) !== null) {
    const language = (match[2] || "").toLowerCase().trim()
    const code = match[3]
    const lineNum = content.slice(0, match.index).split("\n").length

    // Determine if this fenced block is inside an http-example or http-expected
    const isInsideHttpExpected = httpExpectedRegions.some(
      r => lineNum >= r.start && lineNum <= r.end + 2
    )
    const isInsideHttpExample = httpExampleRegions.some(
      r => !r.selfClosing && lineNum > r.start && lineNum < r.end
    )
    const isInsideHttpWoql = httpWoqlRegions.some(
      r => lineNum >= r.start && lineNum <= r.end
    )

    // JSON blocks inside http-example (after http-woql) are WOQL AST
    const isWoqlAst = isInsideHttpExample && language === "json" && !isInsideHttpExpected

    // Determine if JSON is display-only
    const isDisplayJson = language === "json" && isJsonDisplayOnly(code, {
      insideHttpExpected: isInsideHttpExpected,
    })

    blocks.push({
      language: language || "unknown",
      content: code.trim(),
      line: lineNum,
      type: isInsideHttpWoql ? "http-woql-code" : "fenced",
      method: null,
      path: null,
      httpExpected: null,
      isDisplayJson,
      isHttpExpectedContent: isInsideHttpExpected,
      isWoqlAst,
      runnable: !isInsideHttpExpected && !isWoqlAst,
    })
  }

  // Sort by line number
  blocks.sort((a, b) => a.line - b.line)

  return blocks
}

// ── YAML generation ─────────────────────────────────────────────────────────

/**
 * Escape a YAML string value. Uses double quotes if the string contains
 * special characters.
 */
function yamlString(value) {
  if (value === null || value === undefined) return "null"
  const str = String(value)
  // If it contains newlines, use block scalar
  if (str.includes("\n")) {
    const indented = str.split("\n").map(l => `    ${l}`).join("\n")
    return `|\n${indented}`
  }
  // If it contains special characters, quote it
  if (/[:{}\[\],&*#?|<>=!%@`"']/.test(str) || str.trim() !== str || str === "") {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
  }
  return str
}

/**
 * Generate the action description for an http-example block.
 */
function describeHttpAction(method, path) {
  const cleanPath = path.replace(/\?.*$/, "") // Remove query string for description
  const parts = cleanPath.split("/").filter(Boolean)

  // Common API patterns
  if (parts[0] === "api") {
    const resource = parts[1] || ""
    switch (resource) {
      case "document":
        if (method === "GET") return `Retrieve documents from ${parts.slice(2).join("/")}`
        if (method === "POST") return `Create document in ${parts.slice(2).join("/")}`
        if (method === "PUT") return `Replace document in ${parts.slice(2).join("/")}`
        if (method === "DELETE") return `Delete document from ${parts.slice(2).join("/")}`
        break
      case "woql":
        return `Execute WOQL query on ${parts.slice(2).join("/")}`
      case "branch":
        if (method === "POST") return `Create branch ${parts[parts.length - 1]}`
        if (method === "DELETE") return `Delete branch ${parts[parts.length - 1]}`
        break
      case "clone":
        return `Clone database to ${parts.slice(2).join("/")}`
      case "diff":
        return `Compute diff for ${parts.slice(2).join("/")}`
      case "apply":
        return `Apply changes to ${parts.slice(2).join("/")}`
      case "info":
        return "Get server info"
      case "schema":
        if (method === "GET") return `Get schema for ${parts.slice(2).join("/")}`
        if (method === "POST") return `Update schema for ${parts.slice(2).join("/")}`
        break
      default:
        return `${method} ${path}`
    }
  }
  return `${method} ${path}`
}

/**
 * Determine expected_outcome for an http-example block.
 */
function inferHttpExpectedOutcome(block) {
  if (block.httpExpected) {
    // Parse the expected response to determine type
    const expected = block.httpExpected.trim()

    // Try to determine if it's a success response
    if (expected.includes('"api:success"')) {
      return {
        type: "response_body",
        value: expected,
        tolerance: "contains",
      }
    }

    // Array response
    if (expected.startsWith("[")) {
      return {
        type: "response_body",
        value: expected,
        tolerance: "exact",
      }
    }

    // Object response
    if (expected.startsWith("{")) {
      return {
        type: "response_body",
        value: expected,
        tolerance: "exact",
      }
    }

    return {
      type: "response_body",
      value: expected,
      tolerance: "exact",
    }
  }

  // No explicit expected — infer from method
  switch (block.method) {
    case "GET":
      return { type: "status_code", value: "200", tolerance: "exact" }
    case "POST":
      return { type: "status_code", value: "200", tolerance: "exact" }
    case "PUT":
      return { type: "status_code", value: "200", tolerance: "exact" }
    case "DELETE":
      return { type: "status_code", value: "200", tolerance: "exact" }
    default:
      return { type: "non_empty", value: null, tolerance: "non_empty" }
  }
}

/**
 * Infer expected_outcome for fenced code blocks based on detected action.
 */
function inferFencedBlockExpectedOutcome(block, action) {
  const lang = block.language

  // Bash curl commands
  if (["bash", "sh", "shell", "curl"].includes(lang)) {
    const curlInfo = parseCurlBlock(block.content)
    if (curlInfo) {
      // Curl commands → expect HTTP 200
      return { type: "status_code", value: "200", tolerance: "exact" }
    }
    // Other bash commands → expect exit code 0
    return { type: "exit_code", value: "0", tolerance: "exact" }
  }

  // WOQL queries → expect non-empty bindings
  if (action && action.includes("WOQL")) {
    return { type: "non_empty", value: null, tolerance: "non_empty" }
  }

  // SDK operations that create/connect
  if (action && (action.includes("Connect") || action.includes("Create database") || action.includes("Clone"))) {
    return { type: "state_change", value: null, tolerance: "non_empty" }
  }

  // SDK operations that retrieve
  if (action && (action.includes("Retrieve") || action.includes("Get"))) {
    return { type: "non_empty", value: null, tolerance: "non_empty" }
  }

  // GraphQL queries
  if (lang === "graphql" || lang === "gql") {
    return { type: "non_empty", value: null, tolerance: "non_empty" }
  }

  // JSON schema definitions → schema_valid
  if (lang === "json" && action && action.includes("schema")) {
    return { type: "schema_valid", value: null, tolerance: "exact" }
  }

  // Default: unknown outcome
  return { type: null, value: null, tolerance: null }
}

/**
 * Generate intent YAML for a single page.
 */
function generateIntentYaml(slug, blocks) {
  const entries = []
  let executableIndex = 0

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const skipReason = detectSkipReason(block)

    // Skip blocks that are content of http-expected or WOQL AST display
    if (block.isHttpExpectedContent || block.isWoqlAst) continue

    const entry = {
      block_index: i,
      language: block.language,
      line: block.line,
      type: block.type,
    }

    // Action
    if (block.type === "http-example") {
      entry.action = describeHttpAction(block.method, block.path)
    } else if (block.type === "http-woql-code") {
      entry.action = "WOQL client code (TypeScript SDK example)"
    } else if (skipReason) {
      entry.action = null
    } else {
      // Try pattern-based inference for fenced blocks
      entry.action = inferFencedBlockAction(block)
    }

    // Expected outcome
    if (block.type === "http-example") {
      entry.expected_outcome = inferHttpExpectedOutcome(block)
    } else if (skipReason) {
      entry.expected_outcome = { type: "skip", value: null, tolerance: null }
    } else if (entry.action) {
      // Infer expected_outcome from detected action pattern
      entry.expected_outcome = inferFencedBlockExpectedOutcome(block, entry.action)
    } else {
      entry.expected_outcome = { type: null, value: null, tolerance: null }
    }

    // Dependencies: sequential within page for executable blocks
    if (!skipReason && executableIndex > 0) {
      entry.depends_on = executableIndex - 1
    } else {
      entry.depends_on = null
    }

    // Skip reason
    entry.skip_reason = skipReason

    if (!skipReason) {
      executableIndex++
    }

    entries.push(entry)
  }

  // Generate YAML string
  let yaml = `# Intent skeleton for: ${slug}\n`
  yaml += `# Generated: ${new Date().toISOString().split("T")[0]}\n`
  yaml += `# Auto-fill rate: see stats below\n`
  yaml += `#\n`
  yaml += `# Fields marked "null" require manual annotation.\n`
  yaml += `# See INTENT-CAPTURE-PLAN.md for format specification.\n`
  yaml += `\n`
  yaml += `page: ${slug}\n`
  yaml += `total_blocks: ${entries.length}\n`

  // Stats
  const autoFilled = entries.filter(e => e.action !== null || e.skip_reason !== null).length
  const needsManual = entries.filter(e => e.action === null && e.skip_reason === null).length
  const autoFillRate = entries.length > 0 ? Math.round((autoFilled / entries.length) * 100) : 0
  yaml += `auto_filled: ${autoFilled}\n`
  yaml += `needs_manual: ${needsManual}\n`
  yaml += `auto_fill_rate: ${autoFillRate}%\n`
  yaml += `\n`
  yaml += `blocks:\n`

  for (const entry of entries) {
    yaml += `\n`
    yaml += `  - block_index: ${entry.block_index}\n`
    yaml += `    language: ${entry.language}\n`
    yaml += `    line: ${entry.line}\n`
    yaml += `    type: ${entry.type}\n`
    yaml += `    action: ${yamlString(entry.action)}\n`
    yaml += `    expected_outcome:\n`
    yaml += `      type: ${yamlString(entry.expected_outcome.type)}\n`
    if (entry.expected_outcome.value && entry.expected_outcome.value.length > 80) {
      // Multi-line value
      yaml += `      value: |\n`
      for (const line of entry.expected_outcome.value.split("\n")) {
        yaml += `        ${line}\n`
      }
    } else {
      yaml += `      value: ${yamlString(entry.expected_outcome.value)}\n`
    }
    yaml += `      tolerance: ${yamlString(entry.expected_outcome.tolerance)}\n`
    yaml += `    depends_on: ${entry.depends_on === null ? "null" : entry.depends_on}\n`
    yaml += `    skip_reason: ${yamlString(entry.skip_reason)}\n`
  }

  return { yaml, stats: { total: entries.length, autoFilled, needsManual, autoFillRate } }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const files = collectMarkdownFiles(DOCS_DIR)
  let totalPages = 0
  let totalBlocks = 0
  let totalAutoFilled = 0
  let totalNeedsManual = 0
  const pageResults = []

  // Ensure intent directory exists
  if (!dryRun && !existsSync(INTENT_DIR)) {
    mkdirSync(INTENT_DIR, { recursive: true })
  }

  for (const filePath of files) {
    const slug = relative(DOCS_DIR, filePath).replace(/\/page\.md$/, "")

    // Apply page filter if specified
    if (pageFilter && slug !== pageFilter) continue

    const blocks = extractBlocksWithContext(filePath)

    // Skip pages with no code blocks
    if (blocks.length === 0) continue

    const { yaml, stats } = generateIntentYaml(slug, blocks)
    totalPages++
    totalBlocks += stats.total
    totalAutoFilled += stats.autoFilled
    totalNeedsManual += stats.needsManual
    pageResults.push({ slug, ...stats })

    if (!dryRun && !statsOnly) {
      const outPath = join(INTENT_DIR, `${slug.replace(/\//g, "--")}.yaml`)
      writeFileSync(outPath, yaml)
    }

    if (dryRun && !statsOnly) {
      console.log(`\n${"═".repeat(70)}`)
      console.log(`  ${slug}`)
      console.log(`${"═".repeat(70)}`)
      console.log(yaml)
    }
  }

  // Print summary
  console.log("")
  console.log("════════════════════════════════════════════════════════════════════")
  console.log("  INTENT SKELETON GENERATION — SUMMARY")
  console.log("════════════════════════════════════════════════════════════════════")
  console.log("")
  console.log(`  Pages processed:          ${totalPages}`)
  console.log(`  Total blocks extracted:   ${totalBlocks}`)
  console.log(`  Auto-filled:              ${totalAutoFilled}`)
  console.log(`  Needs manual annotation:  ${totalNeedsManual}`)
  console.log(`  Global auto-fill rate:    ${totalBlocks > 0 ? Math.round((totalAutoFilled / totalBlocks) * 100) : 0}%`)
  console.log("")

  if (!dryRun && !statsOnly) {
    console.log(`  Output directory:         intent/`)
    console.log(`  Files written:            ${totalPages}`)
  } else if (dryRun) {
    console.log("  [DRY RUN — no files written]")
  }

  console.log("")

  // Top pages needing manual work
  const needingWork = pageResults
    .filter(p => p.needsManual > 0)
    .sort((a, b) => b.needsManual - a.needsManual)
    .slice(0, 15)

  if (needingWork.length > 0) {
    console.log("  ── Top pages needing manual annotation ──")
    for (const p of needingWork) {
      console.log(`    ${p.slug.padEnd(45)} ${p.needsManual}/${p.total} blocks`)
    }
    console.log("")
  }

  // Pages fully auto-filled
  const fullyAuto = pageResults.filter(p => p.needsManual === 0)
  if (fullyAuto.length > 0) {
    console.log(`  ── Pages fully auto-filled: ${fullyAuto.length} ──`)
    if (fullyAuto.length <= 20) {
      for (const p of fullyAuto) {
        console.log(`    ✅ ${p.slug}`)
      }
    }
    console.log("")
  }

  console.log("════════════════════════════════════════════════════════════════════")
  console.log("")
}

main()
