#!/usr/bin/env bash
# Clone the Star Wars database from the public templates server
DB="${TERMINUSDB_DB:-star-wars}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

curl -u "$AUTH" -X POST "$URL/api/clone/admin/$DB" \
  -H "Content-Type: application/json" \
  -d '{
    "remote_url": "https://data.terminusdb.org/admin/star-wars",
    "label": "Star Wars",
    "comment": "Cloned from public templates server"
  }'
