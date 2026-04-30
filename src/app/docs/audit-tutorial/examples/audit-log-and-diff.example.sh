#!/usr/bin/env bash
# Demonstrate audit trail: multiple authors, commit log, history, and diff
DB="${TERMINUSDB_DB:-MyDatabase}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

# Second change — different author
curl -s -u "$AUTH" -X PUT \
  "$URL/api/document/admin/$DB?author=bob.finance@example.com&message=Increase+ACME+credit+limit+after+Q1+review&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "standard", "credit_limit": 100000}'

# Third change — tier upgrade
curl -s -u "$AUTH" -X PUT \
  "$URL/api/document/admin/$DB?author=jane.ops@example.com&message=Upgrade+ACME+to+premium+tier&raw_json=true" \
  -H "Content-Type: application/json" \
  -d '{"@id": "terminusdb:///data/customer-acme", "name": "ACME Corp", "tier": "premium", "credit_limit": 100000}'

# Query the commit log
echo "=== Commit Log ==="
LOG=$(curl -s -u "$AUTH" "$URL/api/log/admin/$DB?count=10")
echo "$LOG" | jq

# Get document-level history
echo "=== Document History ==="
curl -s -u "$AUTH" "$URL/api/history/admin/$DB?id=customer-acme" | jq

# Extract commit SHAs for diffing
SHA1=$(echo "$LOG" | jq -r '.[2].identifier')
SHA2=$(echo "$LOG" | jq -r '.[1].identifier')
SHA3=$(echo "$LOG" | jq -r '.[0].identifier')

# Diff commit 1 → commit 2 (credit limit change)
echo "=== Diff: sha-1 → sha-2 ==="
curl -s -u "$AUTH" -X POST "$URL/api/diff/admin/$DB" \
  -H "Content-Type: application/json" \
  -d "{
    \"before_data_version\": \"$SHA1\",
    \"after_data_version\": \"$SHA2\",
    \"document_id\": \"terminusdb:///data/customer-acme\"
  }" | jq

# Diff commit 2 → commit 3 (tier upgrade)
echo "=== Diff: sha-2 → sha-3 ==="
curl -s -u "$AUTH" -X POST "$URL/api/diff/admin/$DB" \
  -H "Content-Type: application/json" \
  -d "{
    \"before_data_version\": \"$SHA2\",
    \"after_data_version\": \"$SHA3\",
    \"document_id\": \"terminusdb:///data/customer-acme\"
  }" | jq

# Cleanup
curl -s -u "$AUTH" -X DELETE "$URL/api/db/admin/$DB"
