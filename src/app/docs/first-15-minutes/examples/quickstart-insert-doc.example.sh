#!/bin/bash
# quickstart-insert-doc.example.sh
# fixture: quickstart-create-db
set -e
TERMINUSDB_URL="${TERMINUSDB_URL:-http://localhost:6363}"
TERMINUSDB_USER="${TERMINUSDB_USER:-admin}"
TERMINUSDB_KEY="${TERMINUSDB_KEY:-root}"
DB="${TERMINUSDB_DB:-MyDatabase}"

curl -s -u "$TERMINUSDB_USER:$TERMINUSDB_KEY" -X POST \
  "$TERMINUSDB_URL/api/document/admin/$DB?author=admin&message=Add+Jane+Smith&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id":"terminusdb:///data/jane","name":"Jane Smith","email":"jane@example.com","age":30}'
