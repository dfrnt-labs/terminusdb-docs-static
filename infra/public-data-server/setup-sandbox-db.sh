#!/bin/bash
# setup-sandbox-db.sh — Create and populate the public/sandbox database
#
# PURPOSE
#   Creates the public/sandbox database on data.terminusdb.org, loads the
#   Product schema and sample data, creates a feature branch, and grants
#   anonymous read access.  This database is the live target for docs
#   examples (branch-howto, git-for-data-reference, time-travel-howto, etc.).
#
# USAGE (run inside the container via fly ssh console)
#   fly ssh console --app dfrnt-data-terminusdb
#   /app/terminusdb/setup-sandbox-db.sh
#
# USAGE (run locally against a TerminusDB server already running)
#   TERMINUSDB_SERVER_URL=http://localhost:6363 \
#   TERMINUSDB_ADMIN_PASS=<password> \
#     ./setup-sandbox-db.sh
#
# IDEMPOTENCY
#   The script is safe to re-run.  If the database already exists the
#   db create step will fail with a non-fatal error (exit code ignored).
#   Document inserts are idempotent for Lexical-keyed documents.
#
# VERIFICATION (after the script completes)
#   # Anonymous document read:
#   curl -s "https://data.terminusdb.org/api/document/public/sandbox?as_list=true&type=Product&count=1"
#
#   # Branch list (should include main + feature):
#   curl -s -u "admin:${TERMINUSDB_ADMIN_PASS}" \
#     "https://data.terminusdb.org/api/db/public/sandbox?branches=true"
#
#   # Clone (what end-users do):
#   terminusdb clone https://data.terminusdb.org/public/sandbox --token=anonymous
#
# NOTES
#   - Requires the cloner role to exist (created by bootstrap-templates.sh on
#     first boot; safe to call again — role create is idempotent if already
#     present, or will error non-fatally).
#   - The feature branch is created from main so diff/merge examples have
#     a meaningful base.

set -e

TDB="/app/terminusdb/terminusdb"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/templates"

# Allow overriding the binary path for local testing
if [ -n "$TERMINUSDB_BIN" ]; then
    TDB="$TERMINUSDB_BIN"
fi

echo "=== Setting up public/sandbox database ==="
echo ""

# Ensure the public organisation exists (no-op if already present)
echo "[1/7] Ensuring public organisation exists..."
$TDB organization create public 2>/dev/null || true

# Create the database (no-op if already present)
echo "[2/7] Creating public/sandbox database..."
$TDB db create public/sandbox \
  --label "Sandbox" \
  --comment "Minimal docs sandbox — Product schema for branch, diff, merge, and time-travel examples" \
  --public \
  --schema 2>/dev/null || echo "  (database already exists — skipping create)"

# Load schema
echo "[3/7] Loading Product schema..."
if [ -f "$TEMPLATE_DIR/sandbox/schema.json" ] && [ -s "$TEMPLATE_DIR/sandbox/schema.json" ]; then
    $TDB doc insert public/sandbox --graph_type=schema \
      < "$TEMPLATE_DIR/sandbox/schema.json"
    echo "  Schema loaded from $TEMPLATE_DIR/sandbox/schema.json"
else
    echo "  ERROR: schema file not found at $TEMPLATE_DIR/sandbox/schema.json" >&2
    exit 1
fi

# Load data
echo "[4/7] Loading sample Product documents..."
if [ -f "$TEMPLATE_DIR/sandbox/data.json" ] && [ -s "$TEMPLATE_DIR/sandbox/data.json" ]; then
    $TDB doc insert public/sandbox \
      < "$TEMPLATE_DIR/sandbox/data.json"
    echo "  Data loaded from $TEMPLATE_DIR/sandbox/data.json"
else
    echo "  ERROR: data file not found at $TEMPLATE_DIR/sandbox/data.json" >&2
    exit 1
fi

# Create feature branch from main
echo "[5/7] Creating feature branch..."
$TDB branch create public/sandbox/local/branch/feature \
  --origin public/sandbox/local/branch/main 2>/dev/null || \
  echo "  (feature branch already exists — skipping)"

# Apply changes to feature branch so diff/merge examples have something to show:
#   - Reduced price on Wireless Noise-Cancelling Headphones (299.99 → 249.99)
#   - New product Smart Home Hub added only on this branch
echo "  Applying feature branch changes..."
printf '{"@id":"Product/Wireless%%20Noise-Cancelling%%20Headphones","@type":"Product","name":"Wireless Noise-Cancelling Headphones","price":249.99,"category":"Electronics"}\n' | \
  $TDB doc replace public/sandbox/local/branch/feature 2>/dev/null || \
  echo "  (headphones price already updated — skipping replace)"
printf '{"@type":"Product","name":"Smart Home Hub","price":79.99,"category":"Electronics"}\n' | \
  $TDB doc insert public/sandbox/local/branch/feature 2>/dev/null || \
  echo "  (Smart Home Hub already exists — skipping insert)"
echo "  Feature branch changes applied."

# Ensure cloner role exists (idempotent)
echo "[6/7] Ensuring cloner role exists..."
$TDB role create cloner clone commit_read_access 2>/dev/null || \
  echo "  (cloner role already exists — skipping)"

# Grant capabilities
echo "[7/7] Granting capabilities to public and anonymous users..."
$TDB capability grant public     public/sandbox cloner
$TDB capability grant anonymous  public/sandbox cloner
echo "  Capabilities granted."

echo ""
echo "=== public/sandbox setup complete ==="
echo ""
echo "Verify anonymous access:"
echo "  curl -s 'https://data.terminusdb.org/api/document/public/sandbox?as_list=true&type=Product&count=5'"
echo ""
echo "Verify branch divergence:"
echo "  main:    7 products (Headphones at 299.99)"
echo "  feature: 8 products (Headphones at 249.99, Smart Home Hub added)"
echo ""
echo "Clone command for end-users:"
echo "  terminusdb clone https://data.terminusdb.org/public/sandbox --token=anonymous"
echo ""
echo "Local clone via HTTP (for docs examples that use localhost):"
echo "  curl -u admin:root -X POST http://localhost:6363/api/clone/admin/sandbox \\"
echo "    -d '{\"remote_url\": \"http://public:public@data.terminusdb.org/public/sandbox\"}'"
