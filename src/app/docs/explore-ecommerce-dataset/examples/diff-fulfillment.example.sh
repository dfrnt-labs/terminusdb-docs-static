#!/usr/bin/env bash
# Diff the fulfillment branch against main to see field-level changes
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

curl -s -u "$AUTH" -X POST "$URL/api/diff" \
  -H "Content-Type: application/json" \
  -d '{
    "before_data_version": "admin/ecommerce/local/branch/main",
    "after_data_version": "admin/ecommerce/local/branch/fulfillment"
  }'
