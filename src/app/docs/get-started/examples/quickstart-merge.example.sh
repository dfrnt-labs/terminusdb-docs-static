#!/bin/bash
# quickstart-merge.example.sh
# fixture: quickstart-edit-on-branch
set -e
TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"
TERMINUSDB_USER="${TERMINUSDB_USER:-admin}"
TERMINUSDB_KEY="${TERMINUSDB_KEY:-root}"
DB="${TERMINUSDB_DB:-MyDatabase}"

curl -s -u "$TERMINUSDB_USER:$TERMINUSDB_KEY" -X POST \
  "$TERMINUSDB_URL/api/apply/admin/$DB/local/branch/main" \
  -H "Content-Type: application/json" \
  -d '{"before_commit": "main", "after_commit": "feature", "commit_info": {"author": "admin", "message": "Merge feature into main"}}'
