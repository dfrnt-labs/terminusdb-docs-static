#!/bin/bash
# quickstart-create-db.example.sh
# fixture: docs-test
set -e
TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"
TERMINUSDB_USER="${TERMINUSDB_USER:-admin}"
TERMINUSDB_KEY="${TERMINUSDB_KEY:-root}"
DB="${TERMINUSDB_DB:-MyDatabase}"

curl -s -u "$TERMINUSDB_USER:$TERMINUSDB_KEY" -X POST "$TERMINUSDB_URL/api/db/admin/$DB" \
  -H "Content-Type: application/json" \
  -d "{\"label\": \"$DB\", \"comment\": \"My first TerminusDB database\"}"
