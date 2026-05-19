#!/bin/bash
set -e

# Build-time bootstrap: starts TerminusDB, runs bootstrap-templates.sh,
# seeds tdb-example-mydb via Node.js, stops TDB.
# Called from Dockerfile RUN step. All data is baked into the image layer.

export TERMINUSDB_ADMIN_PASS="build-time-password"
TDB="/app/terminusdb/terminusdb"

echo "Initialising TerminusDB store..."
$TDB store init --key "$TERMINUSDB_ADMIN_PASS"

echo "Starting TerminusDB for bootstrap..."
$TDB serve &
TDB_PID=$!

# Wait for TerminusDB to accept connections
echo "Waiting for TerminusDB to become ready..."
RETRIES=60
until (echo > /dev/tcp/localhost/6363) 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo "ERROR: TerminusDB failed to start within 60 seconds" >&2
        exit 1
    fi
    sleep 1
done
sleep 2
echo "TerminusDB is ready."

# --- Phase 1: Run main bootstrap (star-wars, ecommerce, nuclear, lego, sandbox) ---
echo ""
echo "=== Phase 1: Template databases ==="
/app/terminusdb/bootstrap-templates.sh

# --- Phase 2: Seed tdb-example-mydb via Node.js ---
echo ""
echo "=== Phase 2: Seeding tdb-example-mydb ==="

echo "Running seed script (creates public/tdb-example-mydb with 11 commits + branches)..."
(
  cd /app/terminusdb/seed
  export TERMINUSDB_SERVER="http://127.0.0.1:6363"
  export TDB_ADMIN_PASS="$TERMINUSDB_ADMIN_PASS"
  export TDB_ORG="public"
  export TDB_DB_NAME="tdb-example-mydb"
  node seed-tdb-example-mydb.mjs --force
)

echo "Granting capabilities for tdb-example-mydb..."
$TDB capability grant public public/tdb-example-mydb cloner
$TDB capability grant anonymous public/tdb-example-mydb cloner

echo "  ✓ public/tdb-example-mydb ready (with full commit history)"

# --- Phase 3: Randomise admin password (must be last — after all admin operations) ---
echo ""
echo "=== Phase 3: Randomising admin password ==="
RANDOM_PASS=$(openssl rand -base64 32)
$TDB user password admin --password "$RANDOM_PASS"
echo "  ✓ Admin password randomised (unknown at runtime — set via TERMINUSDB_ADMIN_PASS secret)"

# --- Cleanup ---
echo ""
echo "Bootstrap complete — stopping TerminusDB..."
kill $TDB_PID
wait $TDB_PID 2>/dev/null || true  # kill signal causes non-zero exit, expected

echo "Build-time bootstrap done successfully."
