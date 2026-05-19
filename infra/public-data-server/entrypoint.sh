#!/bin/bash
set -e

# Runtime entrypoint: databases are baked into the image at build time.
# This script just randomises the admin password and starts TerminusDB.

STORAGE_DIR="/app/terminusdb/storage"

# Randomise admin password at runtime using Fly secret (or generate one)
if [ -n "$TERMINUSDB_ADMIN_PASS" ]; then
    /app/terminusdb/terminusdb user password admin --password "$TERMINUSDB_ADMIN_PASS"
    echo "Admin password set from TERMINUSDB_ADMIN_PASS secret."
else
    RUNTIME_PASS=$(openssl rand -base64 32)
    /app/terminusdb/terminusdb user password admin --password "$RUNTIME_PASS"
    echo "Admin password randomised (no TERMINUSDB_ADMIN_PASS set)."
fi

# Start TerminusDB in foreground
echo "TerminusDB running on port ${TERMINUSDB_SERVER_PORT:-6363}"
exec /app/terminusdb/terminusdb serve
