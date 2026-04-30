#!/usr/bin/env bash
# Clone the ecommerce dataset from the public templates server
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

curl -u "$AUTH" -X POST "$URL/api/clone/admin/ecommerce" \
  -H "Content-Type: application/json" \
  -H "Authorization-Remote: Basic cHVibGljOnB1YmxpYw==" \
  -d '{
    "remote_url": "https://data.terminusdb.org/admin/ecommerce",
    "label": "Ecommerce",
    "comment": "Ecommerce tutorial dataset"
  }'
