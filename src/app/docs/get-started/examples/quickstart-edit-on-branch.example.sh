#!/bin/bash
# quickstart-edit-on-branch.example.sh
# fixture: quickstart-create-branch
set -e
TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"
TERMINUSDB_USER="${TERMINUSDB_USER:-admin}"
TERMINUSDB_KEY="${TERMINUSDB_KEY:-root}"
DB="${TERMINUSDB_DB:-MyDatabase}"

curl -s -u "$TERMINUSDB_USER:$TERMINUSDB_KEY" -X PUT \
  "$TERMINUSDB_URL/api/document/$TERMINUSDB_USER/$DB/local/branch/feature?author=$TERMINUSDB_USER&message=Update+Jane+email&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id":"terminusdb:///data/jane","name":"Jane Smith","email":"jane.smith@company.com","age":30}'
