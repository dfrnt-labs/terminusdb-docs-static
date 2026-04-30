#!/usr/bin/env bash
# Create database and insert data with audit metadata
DB="${TERMINUSDB_DB:-MyDatabase}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

# Create database
curl -s -u "$AUTH" -X POST "$URL/api/db/admin/$DB" \
  -H "Content-Type: application/json" \
  -d "{\"label\": \"$DB\", \"comment\": \"Audit tutorial\"}"

# Insert with meaningful author and message
curl -s -u "$AUTH" -X POST \
  "$URL/api/document/admin/$DB?author=jane.ops@example.com&message=Onboard+new+customer+ACME+Corp&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 50000}'
