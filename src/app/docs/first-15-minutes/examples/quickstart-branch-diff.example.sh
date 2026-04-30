#!/bin/bash
# quickstart-branch-diff.example.sh
# fixture: quickstart-edit-on-branch
set -e
TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"
TERMINUSDB_USER="${TERMINUSDB_USER:-admin}"
TERMINUSDB_KEY="${TERMINUSDB_KEY:-root}"
DB="${TERMINUSDB_DB:-MyDatabase}"

curl -s -u "$TERMINUSDB_USER:$TERMINUSDB_KEY" -X POST "$TERMINUSDB_URL/api/diff/admin/$DB" \
  -H "Content-Type: application/json" \
  -d '{
    "before_data_version": "main",
    "after_data_version": "feature"
  }'
