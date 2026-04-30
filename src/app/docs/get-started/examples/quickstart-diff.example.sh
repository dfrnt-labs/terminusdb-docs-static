#!/bin/bash
# quickstart-diff.example.sh
# fixture: quickstart-edit-on-branch
set -e
TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"
TERMINUSDB_USER="${TERMINUSDB_USER:-admin}"
TERMINUSDB_KEY="${TERMINUSDB_KEY:-root}"

curl -s -u "$TERMINUSDB_USER:$TERMINUSDB_KEY" -X POST "$TERMINUSDB_URL/api/diff" \
  -H "Content-Type: application/json" \
  -d '{
    "before": {"@id":"terminusdb:///data/jane","name":"Jane Smith","email":"jane@example.com","age":30},
    "after":  {"@id":"terminusdb:///data/jane","name":"Jane Smith","email":"jane.smith@company.com","age":30},
    "keep": {"@id": true, "name": true, "age": true}
  }'
