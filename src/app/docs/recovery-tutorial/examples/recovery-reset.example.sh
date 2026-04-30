#!/usr/bin/env bash
# Demonstrate recovery via log inspection, branching, and reset
DB="${TERMINUSDB_DB:-MyDatabase}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

# Make the "good" change (price update)
curl -s -u "$AUTH" -X PUT \
  "$URL/api/document/admin/$DB?author=admin&message=Update+widget+price+to+12.50&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/product-001", "name": "Widget", "price": 12.50, "status": "active"}'

# Make the "bad" change (delete)
curl -s -u "$AUTH" -X DELETE \
  "$URL/api/document/admin/$DB?author=admin&message=Accidentally+deleted+product&id=terminusdb:///data/product-001"

# View the log
LOG=$(curl -s -u "$AUTH" "$URL/api/log/admin/$DB?count=10")
echo "$LOG" | jq

# Extract the good commit SHA (second entry — the price update)
GOOD_SHA=$(echo "$LOG" | jq -r '.[1].identifier')
echo "Good commit: $GOOD_SHA"

# Create a branch from the good commit to verify
curl -s -u "$AUTH" -X POST \
  "$URL/api/branch/admin/$DB/local/branch/recovery-check" \
  -H "Content-Type: application/json" \
  -d "{\"origin\": \"admin/$DB/local/commit/$GOOD_SHA\"}"

# Verify document exists on the recovery branch
curl -s -u "$AUTH" \
  "$URL/api/document/admin/$DB/local/branch/recovery-check?id=terminusdb:///data/product-001&raw_json=true" | jq

# Reset main to the good commit
curl -s -u "$AUTH" -X POST "$URL/api/reset/admin/$DB" \
  -H "Content-Type: application/json" \
  -d "{\"commit_descriptor\": \"admin/$DB/local/commit/$GOOD_SHA\"}"

# Confirm recovery
RESULT=$(curl -s -u "$AUTH" "$URL/api/document/admin/$DB?id=terminusdb:///data/product-001&raw_json=true")
echo "$RESULT" | jq

# Cleanup
curl -s -u "$AUTH" -X DELETE "$URL/api/db/admin/$DB"
