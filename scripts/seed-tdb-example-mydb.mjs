#!/usr/bin/env node

/**
 * Seed Script: tdb-example-mydb — Project Tracker with Rich History
 *
 * Creates the `admin/mydb` database with exactly 11 commits demonstrating
 * TerminusDB's versioning: schema, document CRUD, field updates, branches,
 * merges, subdocument insertion, and bulk updates.
 *
 * Usage:
 *   node scripts/seed-tdb-example-mydb.mjs
 *   node scripts/seed-tdb-example-mydb.mjs --force   # Skip confirmation on delete
 *
 * Environment variables:
 *   TERMINUSDB_SERVER  — Server URL (default: http://127.0.0.1:6363)
 *   TDB_ADMIN_PASS    — Admin password (default: root)
 *
 * Prerequisites:
 *   - TerminusDB running at TERMINUSDB_SERVER
 *   - npm install (terminusdb client in node_modules)
 *
 * Output:
 *   admin/mydb with:
 *   - 4 schema types (Person, Project, Task, Comment subdocument)
 *   - 11 commits on main (meaningful commit messages)
 *   - 1 branch (sprint-2) created and merged
 *   - Divergent history suitable for diff/merge/time-travel demos
 */

import { createRequire } from "module";
import * as readline from "readline";

const require = createRequire(import.meta.url);
const { WOQLClient } = require("terminusdb");

// ─── Configuration ───────────────────────────────────────────────────────────

const SERVER_URL = process.env.TERMINUSDB_SERVER ?? "http://127.0.0.1:6363";
const USER = "admin";
const ORG = "admin";
const PASSWORD = process.env.TDB_ADMIN_PASS ?? "root";
const DB_NAME = "mydb";
const FORCE = process.argv.includes("--force");

// ─── Utilities ───────────────────────────────────────────────────────────────

function header(title) {
  const line = "═".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(`${line}\n`);
}

function step(label) {
  console.log(`  ▸ ${label}`);
}

async function confirm(message) {
  if (FORCE) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`  ${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const SCHEMA = [
  {
    "@type": "Class",
    "@id": "Person",
    "@key": { "@type": "Lexical", "@fields": ["handle"] },
    "handle": "xsd:string",
    "name": "xsd:string",
    "role": "xsd:string",
  },
  {
    "@type": "Class",
    "@id": "Project",
    "@key": { "@type": "Lexical", "@fields": ["slug"] },
    "slug": "xsd:string",
    "name": "xsd:string",
    "description": { "@type": "Optional", "@class": "xsd:string" },
    "status": "xsd:string",
    "lead": "Person",
  },
  {
    "@type": "Class",
    "@id": "Task",
    "@key": { "@type": "Lexical", "@fields": ["task_id"] },
    "task_id": "xsd:string",
    "title": "xsd:string",
    "description": { "@type": "Optional", "@class": "xsd:string" },
    "status": "xsd:string",
    "priority": "xsd:string",
    "project": "Project",
    "assignee": { "@type": "Optional", "@class": "Person" },
    "comments": { "@type": "Set", "@class": "Comment" },
  },
  {
    "@type": "Class",
    "@id": "Comment",
    "@subdocument": [],
    "@key": { "@type": "Random" },
    "text": "xsd:string",
    "author": "Person",
    "created_at": "xsd:dateTime",
  },
];

// ─── Seed Data ───────────────────────────────────────────────────────────────

const TEAM_MEMBERS = [
  { "@type": "Person", "handle": "alice", "name": "Alice Chen", "role": "developer" },
  { "@type": "Person", "handle": "bob", "name": "Bob Martinez", "role": "designer" },
  { "@type": "Person", "handle": "carol", "name": "Carol Singh", "role": "pm" },
];

const PROJECT = {
  "@type": "Project",
  "slug": "website-redesign",
  "name": "Website Redesign",
  "description": "Modernise the company website with new branding",
  "status": "active",
  "lead": "Person/carol",
};

const TASKS = [
  { "@type": "Task", "task_id": "PROJ-001", "title": "Design new homepage layout", "description": "Create wireframes and mockups for the new homepage", "status": "todo", "priority": "high", "project": "Project/website-redesign", "comments": [] },
  { "@type": "Task", "task_id": "PROJ-002", "title": "Implement responsive navigation", "description": "Build mobile-first nav component", "status": "todo", "priority": "high", "project": "Project/website-redesign", "comments": [] },
  { "@type": "Task", "task_id": "PROJ-003", "title": "Migrate blog content", "description": "Move 50 blog posts to new CMS structure", "status": "todo", "priority": "medium", "project": "Project/website-redesign", "comments": [] },
  { "@type": "Task", "task_id": "PROJ-004", "title": "Set up analytics dashboard", "description": "Configure tracking and reporting", "status": "todo", "priority": "low", "project": "Project/website-redesign", "comments": [] },
  { "@type": "Task", "task_id": "PROJ-005", "title": "Write accessibility audit", "description": "Full WCAG 2.1 AA compliance check", "status": "todo", "priority": "medium", "project": "Project/website-redesign", "comments": [] },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  header("Seed: tdb-example-mydb (Project Tracker)");
  console.log(`  Server:   ${SERVER_URL}`);
  console.log(`  Database: ${ORG}/${DB_NAME}`);
  console.log(`  Force:    ${FORCE}`);
  console.log();

  // Connect
  const client = new WOQLClient(SERVER_URL, {
    user: USER,
    organization: ORG,
    key: PASSWORD,
  });

  // ─── Delete existing database if present ─────────────────────────────────

  step("Checking if database already exists...");
  try {
    const dbs = await client.getDatabases();
    const exists = dbs.some(
      (db) => db.name === DB_NAME || db.path === `${ORG}/${DB_NAME}`,
    );
    if (exists) {
      const proceed = await confirm(
        `Database ${ORG}/${DB_NAME} already exists. Delete and recreate?`,
      );
      if (!proceed) {
        console.log("  Aborted.");
        process.exit(0);
      }
      step(`Deleting ${ORG}/${DB_NAME}...`);
      await client.deleteDatabase(DB_NAME, ORG);
      step("✓ Deleted");
    }
  } catch (err) {
    // getDatabases may fail if server is fresh — continue
    step(`  (could not check existing databases: ${err.message})`);
  }

  // ─── Create database ─────────────────────────────────────────────────────

  step("Creating database...");
  await client.createDatabase(DB_NAME, {
    label: "My Database",
    comment: "Project tracker — docs example with rich commit history",
    schema: true,
  });
  step(`✓ Created ${ORG}/${DB_NAME}`);

  // Connect to the new database
  client.db(DB_NAME);

  // ─── Commit 1: Schema + Team Members ─────────────────────────────────────

  header("Commit 1/11 — Initialise project tracker with team members");

  step("Inserting schema (4 types)...");
  await client.addDocument(SCHEMA, { graph_type: "schema" }, undefined, "Add project tracker schema");
  step("✓ Schema inserted");

  step("Inserting 3 team members...");
  await client.addDocument(TEAM_MEMBERS, {}, undefined, "Initialise project tracker with team members");
  step("✓ Team members: alice, bob, carol");

  // ─── Commit 2: Project + Tasks ───────────────────────────────────────────

  header("Commit 2/11 — Add website redesign project with initial tasks");

  step("Inserting project and 5 tasks...");
  await client.addDocument(
    [PROJECT, ...TASKS],
    {},
    undefined,
    "Add website redesign project with initial tasks",
  );
  step("✓ 1 project + 5 tasks (all todo, unassigned)");

  // ─── Commit 3: Assign Tasks ──────────────────────────────────────────────

  header("Commit 3/11 — Assign tasks to team members");

  step("Assigning tasks to team members...");
  const assignUpdates = [
    { "@type": "Task", "@id": "Task/PROJ-001", "task_id": "PROJ-001", "title": "Design new homepage layout", "description": "Create wireframes and mockups for the new homepage", "status": "todo", "priority": "high", "project": "Project/website-redesign", "assignee": "Person/bob", "comments": [] },
    { "@type": "Task", "@id": "Task/PROJ-002", "task_id": "PROJ-002", "title": "Implement responsive navigation", "description": "Build mobile-first nav component", "status": "todo", "priority": "high", "project": "Project/website-redesign", "assignee": "Person/alice", "comments": [] },
    { "@type": "Task", "@id": "Task/PROJ-003", "task_id": "PROJ-003", "title": "Migrate blog content", "description": "Move 50 blog posts to new CMS structure", "status": "todo", "priority": "medium", "project": "Project/website-redesign", "assignee": "Person/alice", "comments": [] },
    { "@type": "Task", "@id": "Task/PROJ-005", "task_id": "PROJ-005", "title": "Write accessibility audit", "description": "Full WCAG 2.1 AA compliance check", "status": "todo", "priority": "medium", "project": "Project/website-redesign", "assignee": "Person/bob", "comments": [] },
  ];
  await client.updateDocument(assignUpdates, {}, undefined, "Assign tasks to team members");
  step("✓ PROJ-001→bob, PROJ-002→alice, PROJ-003→alice, PROJ-005→bob");
  step("  (PROJ-004 remains unassigned)");

  // ─── Commit 4: Start Sprint ──────────────────────────────────────────────

  header("Commit 4/11 — Begin sprint — move assigned tasks to in-progress");

  step("Moving PROJ-001 and PROJ-002 to in-progress...");
  const sprintStart = [
    { "@type": "Task", "@id": "Task/PROJ-001", "task_id": "PROJ-001", "title": "Design new homepage layout", "description": "Create wireframes and mockups for the new homepage", "status": "in-progress", "priority": "high", "project": "Project/website-redesign", "assignee": "Person/bob", "comments": [] },
    { "@type": "Task", "@id": "Task/PROJ-002", "task_id": "PROJ-002", "title": "Implement responsive navigation", "description": "Build mobile-first nav component", "status": "in-progress", "priority": "high", "project": "Project/website-redesign", "assignee": "Person/alice", "comments": [] },
  ];
  await client.updateDocument(sprintStart, {}, undefined, "Begin sprint — move assigned tasks to in-progress");
  step("✓ PROJ-001: todo → in-progress");
  step("✓ PROJ-002: todo → in-progress");

  // ─── Commit 5: Add Comments ──────────────────────────────────────────────

  header("Commit 5/11 — Add design review comments to homepage task");

  step("Adding 2 comments to PROJ-001...");
  const taskWithComments = {
    "@type": "Task",
    "@id": "Task/PROJ-001",
    "task_id": "PROJ-001",
    "title": "Design new homepage layout",
    "description": "Create wireframes and mockups for the new homepage",
    "status": "in-progress",
    "priority": "high",
    "project": "Project/website-redesign",
    "assignee": "Person/bob",
    "comments": [
      { "@type": "Comment", "text": "First draft looks great — can we try a darker header?", "author": "Person/carol", "created_at": "2026-03-15T10:30:00Z" },
      { "@type": "Comment", "text": "Updated with darker palette. Ready for review.", "author": "Person/bob", "created_at": "2026-03-16T14:15:00Z" },
    ],
  };
  await client.updateDocument(taskWithComments, {}, undefined, "Add design review comments to homepage task");
  step("✓ 2 comments added (carol + bob)");

  // ─── Commit 6: Complete Task ─────────────────────────────────────────────

  header("Commit 6/11 — Homepage design approved — mark as done");

  step("Moving PROJ-001 to done...");
  const completedTask = {
    "@type": "Task",
    "@id": "Task/PROJ-001",
    "task_id": "PROJ-001",
    "title": "Design new homepage layout",
    "description": "Create wireframes and mockups for the new homepage",
    "status": "done",
    "priority": "high",
    "project": "Project/website-redesign",
    "assignee": "Person/bob",
    "comments": [
      { "@type": "Comment", "text": "First draft looks great — can we try a darker header?", "author": "Person/carol", "created_at": "2026-03-15T10:30:00Z" },
      { "@type": "Comment", "text": "Updated with darker palette. Ready for review.", "author": "Person/bob", "created_at": "2026-03-16T14:15:00Z" },
    ],
  };
  await client.updateDocument(completedTask, {}, undefined, "Homepage design approved — mark as done");
  step("✓ PROJ-001: in-progress → done");

  // ─── Commit 7: Create Branch ─────────────────────────────────────────────

  header("Commit 7/11 — Create sprint-2 branch");

  step("Creating branch 'sprint-2' from main...");
  await client.branch("sprint-2");
  step("✓ Branch sprint-2 created");

  // ─── Commit 8: Add Tasks on Branch ───────────────────────────────────────

  header("Commit 8/11 — Plan sprint-2 tasks (on sprint-2 branch)");

  step("Switching to sprint-2 branch...");
  client.checkout("sprint-2");

  step("Adding 2 new tasks...");
  const branchTasks = [
    { "@type": "Task", "task_id": "PROJ-006", "title": "Implement dark mode toggle", "description": "Add theme switching support", "status": "todo", "priority": "high", "project": "Project/website-redesign", "assignee": "Person/alice", "comments": [] },
    { "@type": "Task", "task_id": "PROJ-007", "title": "Design 404 error page", "description": "Create friendly error page with navigation", "status": "todo", "priority": "low", "project": "Project/website-redesign", "assignee": "Person/bob", "comments": [] },
  ];
  await client.addDocument(branchTasks, {}, undefined, "Plan sprint-2 tasks");
  step("✓ PROJ-006 + PROJ-007 added on sprint-2 only");

  // ─── Commit 9: Divergent Change on Main ──────────────────────────────────

  header("Commit 9/11 — Update navigation priority and start blog migration (on main)");

  step("Switching back to main...");
  client.checkout("main");

  step("Completing PROJ-002 and starting PROJ-003...");
  const mainDivergence = [
    { "@type": "Task", "@id": "Task/PROJ-002", "task_id": "PROJ-002", "title": "Implement responsive navigation", "description": "Build mobile-first nav component", "status": "done", "priority": "high", "project": "Project/website-redesign", "assignee": "Person/alice", "comments": [] },
    { "@type": "Task", "@id": "Task/PROJ-003", "task_id": "PROJ-003", "title": "Migrate blog content", "description": "Move 50 blog posts to new CMS structure", "status": "in-progress", "priority": "medium", "project": "Project/website-redesign", "assignee": "Person/alice", "comments": [] },
  ];
  await client.updateDocument(mainDivergence, {}, undefined, "Update navigation priority and start blog migration");
  step("✓ PROJ-002: in-progress → done (on main)");
  step("✓ PROJ-003: todo → in-progress (on main)");

  // ─── Commit 10: Merge sprint-2 into Main ─────────────────────────────────

  header("Commit 10/11 — Merge sprint-2 into main");

  step("Applying sprint-2 changes to main...");
  await client.apply("main", "sprint-2", "Merge sprint-2 into main");
  step("✓ sprint-2 merged — PROJ-006 + PROJ-007 now on main");

  // ─── Commit 11: Archive Completed Work ───────────────────────────────────

  header("Commit 11/11 — Archive completed tasks and close sprint");

  step("Adding ship comment to PROJ-002 and updating project description...");

  // Add comment to PROJ-002
  const proj002WithComment = {
    "@type": "Task",
    "@id": "Task/PROJ-002",
    "task_id": "PROJ-002",
    "title": "Implement responsive navigation",
    "description": "Build mobile-first nav component",
    "status": "done",
    "priority": "high",
    "project": "Project/website-redesign",
    "assignee": "Person/alice",
    "comments": [
      { "@type": "Comment", "text": "Shipped in v2.1 release", "author": "Person/carol", "created_at": "2026-04-01T09:00:00Z" },
    ],
  };

  // Update project description
  const updatedProject = {
    "@type": "Project",
    "@id": "Project/website-redesign",
    "slug": "website-redesign",
    "name": "Website Redesign",
    "description": "Modernise the company website with new branding (Phase 1 complete)",
    "status": "active",
    "lead": "Person/carol",
  };

  await client.updateDocument(
    [proj002WithComment, updatedProject],
    {},
    undefined,
    "Archive completed tasks and close sprint",
  );
  step("✓ PROJ-002: comment added (shipped v2.1)");
  step("✓ Project: description updated (Phase 1 complete)");

  // ─── Verification ────────────────────────────────────────────────────────

  header("Verification");

  step("Checking commit count...");
  const logUrl = `${SERVER_URL}/api/log/${ORG}/${DB_NAME}/local/branch/main?count=20`;
  const logResponse = await fetch(logUrl, {
    headers: { "Authorization": "Basic " + Buffer.from(`${USER}:${PASSWORD}`).toString("base64") },
  });
  const log = await logResponse.json();
  console.log(`  Commits on main: ${log.length}`);
  console.log();
  console.log("  Commit messages:");
  for (const entry of log) {
    console.log(`    • ${entry.message ?? entry["api:message"] ?? "(no message)"}`);
  }

  step("\nChecking document counts...");
  const persons = await client.getDocument({ as_list: true, type: "Person" });
  const projects = await client.getDocument({ as_list: true, type: "Project" });
  const tasks = await client.getDocument({ as_list: true, type: "Task" });
  console.log(`  Persons:  ${persons.length}`);
  console.log(`  Projects: ${projects.length}`);
  console.log(`  Tasks:    ${tasks.length}`);

  header("Done");
  console.log(`  Database ${ORG}/${DB_NAME} seeded with 11 commits.`);
  console.log(`  Branch 'sprint-2' exists with divergent history.`);
  console.log();
  console.log("  Clone command for end-users:");
  console.log(`    curl -u admin:root -X POST http://localhost:6363/api/clone/admin/mydb \\`);
  console.log(`      -H "Content-Type: application/json" \\`);
  console.log(`      -H "Authorization-Remote: Basic cHVibGljOnB1YmxpYw==" \\`);
  console.log(`      -d '{"remote_url": "https://data.terminusdb.org/public/tdb-example-mydb", "label": "My Database", "comment": "Project tracker example"}'`);
  console.log();
}

main().catch((err) => {
  console.error("\n  ✗ Fatal error:", err.message ?? err);
  if (err.data) console.error("    Data:", JSON.stringify(err.data, null, 2));
  process.exit(1);
});
