#!/usr/bin/env bash
# Structural diff between main and what-if branches
DB="${TERMINUSDB_DB:-star-wars}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

curl -s -u "$AUTH" -X POST "$URL/api/diff/admin/$DB" \
  -H "Content-Type: application/json" \
  -d '{
    "before_data_version": "main",
    "after_data_version": "what-if"
  }'
