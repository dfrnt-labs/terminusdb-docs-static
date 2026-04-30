#!/usr/bin/env bash
# Query all processing orders with customer details (graph traversal, no JOINs)
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

curl -s -u "$AUTH" -X POST \
  "$URL/api/woql/admin/ecommerce/local/branch/main" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "@type": "And",
      "and": [
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "status"}, "object": {"@type": "DataValue", "data": "processing"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "order_id"}, "object": {"@type": "DataValue", "variable": "OrderId"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "order_date"}, "object": {"@type": "DataValue", "variable": "OrderDate"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "total"}, "object": {"@type": "DataValue", "variable": "Total"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Order"}, "predicate": {"@type": "NodeValue", "node": "customer"}, "object": {"@type": "NodeValue", "variable": "Customer"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Customer"}, "predicate": {"@type": "NodeValue", "node": "name"}, "object": {"@type": "DataValue", "variable": "CustomerName"}},
        {"@type": "Triple", "subject": {"@type": "NodeValue", "variable": "Customer"}, "predicate": {"@type": "NodeValue", "node": "country"}, "object": {"@type": "DataValue", "variable": "Country"}}
      ]
    }
  }'
