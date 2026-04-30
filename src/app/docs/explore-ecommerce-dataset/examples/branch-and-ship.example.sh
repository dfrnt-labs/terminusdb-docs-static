#!/usr/bin/env bash
# Create a fulfillment branch and update order ORD-0003 to "shipped"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

# Create the fulfillment branch
curl -s -u "$AUTH" -X POST \
  "$URL/api/branch/admin/ecommerce/local/branch/fulfillment" \
  -H "Content-Type: application/json" \
  -d '{"origin": "admin/ecommerce/local/branch/main"}'

# Update order status on the branch
curl -s -u "$AUTH" -X PUT \
  "$URL/api/document/admin/ecommerce/local/branch/fulfillment?author=warehouse@example.com&message=Ship+order+ORD-0003&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{
    "@id": "terminusdb:///data/Order/ORD-0003",
    "order_id": "ORD-0003",
    "customer": "Customer/ivan.petrov%40example.com",
    "order_date": "2025-01-07T04:46:08.367Z",
    "status": "shipped",
    "total": 1094.95
  }'
