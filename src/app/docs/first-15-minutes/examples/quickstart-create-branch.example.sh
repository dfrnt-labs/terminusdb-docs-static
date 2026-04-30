#!/bin/bash
# quickstart-create-branch.example.sh
# fixture: quickstart-insert-doc
set -e
TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"
TERMINUSDB_USER="${TERMINUSDB_USER:-admin}"
TERMINUSDB_KEY="${TERMINUSDB_KEY:-root}"
DB="${TERMINUSDB_DB:-MyDatabase}"

curl -s -u "$TERMINUSDB_USER:$TERMINUSDB_KEY" -X POST \
  "$TERMINUSDB_URL/api/branch/admin/$DB/local/branch/feature" \
  -H "Content-Type: application/json" \
  -d "{\"origin\": \"admin/$DB/local/branch/main\"}"
