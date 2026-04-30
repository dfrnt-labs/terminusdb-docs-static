#!/usr/bin/env bash
# Insert a document with author and message, then verify in the log
DB="${TERMINUSDB_DB:-MyDatabase}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

# Create database
curl -s -u "$AUTH" -X POST "$URL/api/db/admin/$DB" \
  -H "Content-Type: application/json" \
  -d "{\"label\": \"$DB\", \"comment\": \"Commit message how-to\"}"

# Insert with author and message
curl -s -u "$AUTH" -X POST \
  "$URL/api/document/admin/$DB?author=jane@example.com&message=Add+new+product+SKU-2001&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/product-2001", "name": "Widget Pro", "price": 29.99}'

# Verify the commit message was recorded
echo "=== Most recent commit ==="
curl -s -u "$AUTH" "$URL/api/log/admin/$DB?count=1" | jq

# Cleanup
curl -s -u "$AUTH" -X DELETE "$URL/api/db/admin/$DB"
