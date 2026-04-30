#!/usr/bin/env bash
# Create database and insert initial data for recovery tutorial
DB="${TERMINUSDB_DB:-MyDatabase}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

# Create database
curl -s -u "$AUTH" -X POST "$URL/api/db/admin/$DB" \
  -H "Content-Type: application/json" \
  -d "{\"label\": \"$DB\", \"comment\": \"Recovery tutorial\"}"

# Insert initial document
curl -s -u "$AUTH" -X POST \
  "$URL/api/document/admin/$DB?author=admin&message=Add+initial+product+data&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/product-001", "name": "Widget", "price": 9.99, "status": "active"}'
