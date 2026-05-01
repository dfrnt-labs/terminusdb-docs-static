#!/usr/bin/env node
/**
 * generate-woql-reference.mjs
 *
 * Generates the WOQL class reference documentation page from the authoritative
 * woql.json schema definition. The schema is a concatenated JSON stream (multiple
 * JSON objects separated by whitespace, not a JSON array).
 *
 * Usage: node scripts/generate-woql-reference.mjs
 *
 * Input:  src/data/woql.json (copied from terminusdb/src/terminus-schema/woql.json)
 * Output: src/app/docs/woql-class-reference-guide/page.md
 *
 * The generated page includes:
 * - Schema metadata (title, description, version, authors)
 * - Classes grouped by inheritance hierarchy:
 *   1. Query subclasses (the main WOQL operations)
 *   2. PathPattern subclasses (graph path expressions)
 *   3. ArithmeticExpression subclasses (numeric operations)
 *   4. Utility types (Value, NodeValue, DataValue, enums, tagged unions, etc.)
 * - For each class: description, field table, inheritance note
 */

import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const INPUT = join(ROOT, "src/data/woql.json")
const OUTPUT = join(ROOT, "src/app/docs/woql-class-reference-guide/page.md")

// ---------------------------------------------------------------------------
// Parse concatenated JSON stream
// ---------------------------------------------------------------------------

/**
 * Parse a concatenated JSON stream (multiple root-level objects separated by
 * whitespace). Uses brace-depth tracking to find object boundaries.
 */
function parseConcatenatedJson(text) {
  const objects = []
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (ch === "\\") {
      if (inString) escaped = true
      continue
    }

    if (ch === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (ch === "{") {
      if (depth === 0) start = i
      depth++
    } else if (ch === "}") {
      depth--
      if (depth === 0 && start >= 0) {
        const jsonStr = text.slice(start, i + 1)
        try {
          objects.push(JSON.parse(jsonStr))
        } catch (e) {
          console.error(`Failed to parse JSON object at position ${start}: ${e.message}`)
        }
        start = -1
      }
    }
  }

  return objects
}

// ---------------------------------------------------------------------------
// Schema analysis helpers
// ---------------------------------------------------------------------------

/**
 * Extract the user-facing fields from a class definition.
 * Excludes @-prefixed metadata keys.
 * Enforces canonical field ordering: subject → predicate → object → graph first,
 * then all other fields in their natural schema order.
 */
function extractFields(cls) {
  const fields = []
  const skipKeys = new Set([
    "@id", "@type", "@documentation", "@key", "@inherits",
    "@abstract", "@subdocument", "@metadata", "@unfoldable",
    "@oneOf"
  ])

  for (const [key, value] of Object.entries(cls)) {
    if (skipKeys.has(key)) continue
    fields.push({ name: key, type: formatType(value) })
  }

  return sortFields(fields)
}

/**
 * Sort fields so that subject, predicate, object, graph always appear
 * in that canonical order at the top of the field table.
 * All other fields follow in their natural schema order.
 */
function sortFields(fields) {
  const priorityOrder = ["subject", "predicate", "object", "graph"]
  const priorityFields = []
  const otherFields = []

  // Separate priority fields from others
  for (const field of fields) {
    const idx = priorityOrder.indexOf(field.name)
    if (idx !== -1) {
      priorityFields.push({ field, priority: idx })
    } else {
      otherFields.push(field)
    }
  }

  // Sort priority fields by their canonical order
  priorityFields.sort((a, b) => a.priority - b.priority)

  // Return priority fields first, then others in natural order
  return [...priorityFields.map((p) => p.field), ...otherFields]
}

/**
 * Format a TerminusDB type reference for display.
 */
function formatType(value) {
  if (typeof value === "string") {
    return formatTypeName(value)
  }
  if (typeof value === "object" && value !== null) {
    const container = value["@type"]
    const inner = value["@class"]
    if (container === "List") {
      return `List(${formatTypeName(inner)})`
    }
    if (container === "Set") {
      return `Set(${formatTypeName(inner)})`
    }
    if (container === "Optional") {
      return `Optional(${formatTypeName(inner)})`
    }
    if (container === "Array") {
      return `Array(${formatTypeName(inner)})`
    }
    // Fallback for other complex types
    return JSON.stringify(value)
  }
  return String(value)
}

/**
 * Format a single type name — strip xsd: prefix for readability where appropriate.
 */
function formatTypeName(name) {
  if (!name) return "unknown"
  if (name.startsWith("xsd:")) {
    return `\`${name}\``
  }
  if (name.startsWith("xdd:")) {
    return `\`${name}\``
  }
  return `\`${name}\``
}

/**
 * Get the property description from @documentation.@properties
 */
function getPropertyDescription(cls, fieldName) {
  const docs = cls["@documentation"]
  if (!docs) return ""
  const props = docs["@properties"]
  if (!props) return ""
  return props[fieldName] || ""
}

/**
 * Get the class comment/description
 */
function getClassComment(cls) {
  const docs = cls["@documentation"]
  if (!docs) return ""
  return docs["@comment"] || ""
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

function generateFieldTable(cls, fields) {
  if (fields.length === 0) return ""

  const rows = fields.map((f) => {
    const desc = getPropertyDescription(cls, f.name)
    return `| \`${f.name}\` | ${f.type} | ${desc} |`
  })

  return [
    "",
    "| Property | Type | Description |",
    "|----------|------|-------------|",
    ...rows,
    "",
  ].join("\n")
}

function generateClassSection(cls) {
  const id = cls["@id"]
  const comment = getClassComment(cls)
  const inherits = cls["@inherits"]
  const isAbstract = Array.isArray(cls["@abstract"])
  const type = cls["@type"]
  const fields = extractFields(cls)

  const lines = []

  // Anchor for linking
  lines.push(`{% anchor id="${id}" /%}`)
  lines.push(`### ${id}`)
  lines.push("")

  if (comment) {
    lines.push(comment)
    lines.push("")
  }

  // Type badge line
  const badges = []
  if (type === "TaggedUnion") badges.push("**Tagged Union**")
  if (type === "Enum") badges.push("**Enum**")
  if (isAbstract) badges.push("**Abstract**")
  if (inherits) badges.push(`**Inherits:** \`${inherits}\``)

  if (badges.length > 0) {
    lines.push(badges.join(" · "))
    lines.push("")
  }

  // Enum values
  if (type === "Enum" && cls["@value"]) {
    lines.push("**Values:** " + cls["@value"].map((v) => `\`${v}\``).join(", "))
    lines.push("")
  }

  // Field table
  if (fields.length > 0) {
    lines.push(generateFieldTable(cls, fields))
  }

  lines.push("* * *")
  lines.push("")

  return lines.join("\n")
}

function generatePage(context, classes) {
  const schemaVersion = context["@metadata"]?.schema_version || "unknown"
  const description = context["@documentation"]?.["@description"] || ""
  const authors = context["@documentation"]?.["@authors"] || []
  const title = context["@documentation"]?.["@title"] || "WOQL Schema"

  // Group classes by inheritance
  const queryClasses = []
  const pathClasses = []
  const arithmeticClasses = []
  const utilityClasses = []

  // Sort into groups
  for (const cls of classes) {
    const inherits = cls["@inherits"]
    const id = cls["@id"]

    if (id === "Query") {
      queryClasses.unshift(cls) // Put abstract parent first
    } else if (id === "PathPattern") {
      pathClasses.unshift(cls)
    } else if (id === "ArithmeticExpression") {
      arithmeticClasses.unshift(cls)
    } else if (inherits === "Query") {
      queryClasses.push(cls)
    } else if (inherits === "PathPattern") {
      pathClasses.push(cls)
    } else if (inherits === "ArithmeticExpression") {
      arithmeticClasses.push(cls)
    } else {
      utilityClasses.push(cls)
    }
  }

  // Sort each group alphabetically (except the abstract parent which stays first)
  const sortByName = (a, b) => (a["@id"] || "").localeCompare(b["@id"] || "")
  if (queryClasses.length > 1) queryClasses.slice(1).sort(sortByName)
  if (pathClasses.length > 1) pathClasses.slice(1).sort(sortByName)
  if (arithmeticClasses.length > 1) arithmeticClasses.slice(1).sort(sortByName)
  utilityClasses.sort(sortByName)

  // Actually re-sort properly: keep first element, sort the rest
  const sortGroup = (group) => {
    if (group.length <= 1) return group
    const first = group[0]
    const rest = group.slice(1).sort(sortByName)
    return [first, ...rest]
  }

  const sortedQuery = sortGroup(queryClasses)
  const sortedPath = sortGroup(pathClasses)
  const sortedArithmetic = sortGroup(arithmeticClasses)

  // Count stats
  const totalClasses = classes.length
  const queryCount = sortedQuery.length
  const pathCount = sortedPath.length
  const arithmeticCount = sortedArithmetic.length
  const utilityCount = utilityClasses.length

  // Build page
  const lines = []

  // Frontmatter
  lines.push("---")
  lines.push("tags:")
  lines.push("  - woql")
  lines.push("  - reference")
  lines.push("  - advanced")
  lines.push("title: WOQL Class Reference Guide")
  lines.push("nextjs:")
  lines.push("  metadata:")
  lines.push("    title: WOQL Class Reference Guide")
  lines.push("    description: Complete reference for all WOQL query language classes, generated from the authoritative schema definition.")
  lines.push("    openGraph:")
  lines.push("      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png")
  lines.push("    alternates:")
  lines.push("      canonical: https://terminusdb.org/docs/woql-class-reference-guide/")
  lines.push("media: []")
  lines.push(`lastUpdated: "${new Date().toISOString().split("T")[0]}"`)
  lines.push("---")
  lines.push("")

  // Introduction
  lines.push("## WOQL Schema")
  lines.push("")
  lines.push(description)
  lines.push("")
  if (authors.length > 0) {
    lines.push(`**Authored by:** ${authors.join(", ")}`)
    lines.push("")
  }
  lines.push(`**Schema version:** ${schemaVersion}`)
  lines.push("")
  lines.push(`{% callout title="Auto-generated reference" %}`)
  lines.push(`This page is generated from the authoritative \`woql.json\` schema definition (${totalClasses} classes). Run \`npm run generate:woql\` to regenerate after schema changes.`)
  lines.push(`{% /callout %}`)
  lines.push("")

  // Table of contents summary
  lines.push("**Contents:**")
  lines.push("")
  lines.push(`- [Query operations](#Query) (${queryCount} classes) — the main WOQL operations`)
  lines.push(`- [Path patterns](#PathPattern) (${pathCount} classes) — graph traversal expressions`)
  lines.push(`- [Arithmetic expressions](#ArithmeticExpression) (${arithmeticCount} classes) — numeric operations`)
  lines.push(`- [Utility types](#utility-types) (${utilityCount} classes) — values, enums, and support types`)
  lines.push("")

  // Query operations section
  lines.push("---")
  lines.push("")
  lines.push("## Query operations")
  lines.push("")
  lines.push("These classes represent WOQL query operations — the building blocks of all database queries.")
  lines.push("")

  for (const cls of sortedQuery) {
    lines.push(generateClassSection(cls))
  }

  // Path patterns section
  lines.push("---")
  lines.push("")
  lines.push("## Path patterns")
  lines.push("")
  lines.push("Path patterns describe how to traverse edges in the graph. They form a regular expression-like language over graph edges.")
  lines.push("")

  for (const cls of sortedPath) {
    lines.push(generateClassSection(cls))
  }

  // Arithmetic expressions section
  lines.push("---")
  lines.push("")
  lines.push("## Arithmetic expressions")
  lines.push("")
  lines.push("Arithmetic expression classes for numeric computations within queries.")
  lines.push("")

  for (const cls of sortedArithmetic) {
    lines.push(generateClassSection(cls))
  }

  // Utility types section
  lines.push("---")
  lines.push("")
  lines.push("{% anchor id=\"utility-types\" /%}")
  lines.push("## Utility types")
  lines.push("")
  lines.push("Support types used as field values in query classes — values, resources, columns, and enumerations.")
  lines.push("")

  for (const cls of utilityClasses) {
    lines.push(generateClassSection(cls))
  }

  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("Reading woql.json from", INPUT)

  const raw = readFileSync(INPUT, "utf-8")
  const objects = parseConcatenatedJson(raw)

  console.log(`Parsed ${objects.length} JSON objects`)

  // Separate context from class definitions
  let context = null
  const classes = []

  for (const obj of objects) {
    if (obj["@type"] === "@context") {
      context = obj
    } else if (obj["@type"] === "Class" || obj["@type"] === "Enum" || obj["@type"] === "TaggedUnion") {
      classes.push(obj)
    } else {
      // Unknown type — skip
      console.warn(`Skipping object with @type: ${obj["@type"]}, @id: ${obj["@id"] || "none"}`)
    }
  }

  if (!context) {
    console.error("ERROR: No @context object found in woql.json")
    process.exit(1)
  }

  console.log(`Found: ${classes.length} classes/enums/unions`)
  console.log(`  - Query subclasses: ${classes.filter((c) => c["@inherits"] === "Query" || c["@id"] === "Query").length}`)
  console.log(`  - PathPattern subclasses: ${classes.filter((c) => c["@inherits"] === "PathPattern" || c["@id"] === "PathPattern").length}`)
  console.log(`  - ArithmeticExpression subclasses: ${classes.filter((c) => c["@inherits"] === "ArithmeticExpression" || c["@id"] === "ArithmeticExpression").length}`)

  const markdown = generatePage(context, classes)

  writeFileSync(OUTPUT, markdown, "utf-8")
  console.log(`\nGenerated: ${OUTPUT}`)
  console.log(`Page size: ${(markdown.length / 1024).toFixed(1)} KB`)
}

main()
