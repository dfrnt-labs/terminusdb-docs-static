#!/bin/bash
set -e

# Fail-closed: refuse to start without an explicit admin password
if [ -z "$TERMINUSDB_ADMIN_PASS" ]; then
  echo "ERROR: TERMINUSDB_ADMIN_PASS is not set. Set it as a Fly secret:" >&2
  echo "  fly secrets set TERMINUSDB_ADMIN_PASS=\"\$(openssl rand -base64 32)\"" >&2
  exit 1
fi
STORAGE_DIR="/app/terminusdb/storage"
BOOTSTRAP_MARKER="$STORAGE_DIR/.bootstrapped"

# Initialise store if first run
if [ ! -d "$STORAGE_DIR/db" ]; then
    echo "Initialising TerminusDB store..."
    /app/terminusdb/terminusdb store init --key "$TERMINUSDB_ADMIN_PASS"
fi

# Start TerminusDB in background for bootstrap
/app/terminusdb/terminusdb serve &
TDB_PID=$!

# Wait for TerminusDB to become healthy (using /dev/tcp — no curl dependency)
echo "Waiting for TerminusDB to start..."
RETRIES=60
until (echo > /dev/tcp/localhost/6363) 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo "ERROR: TerminusDB failed to start within timeout"
        exit 1
    fi
    sleep 1
done
# Give TerminusDB a moment to finish initialisation after port opens
sleep 2
echo "TerminusDB is healthy."

# Bootstrap template databases if not already done
if [ ! -f "$BOOTSTRAP_MARKER" ]; then
    echo "Bootstrapping template databases..."
    /app/terminusdb/bootstrap-templates.sh
    touch "$BOOTSTRAP_MARKER"
    echo "Bootstrap complete."
else
    echo "Template databases already bootstrapped (marker exists)."
fi

# Bring TerminusDB to foreground
echo "TerminusDB running on port ${TERMINUSDB_SERVER_PORT:-6363}"
wait $TDB_PID
