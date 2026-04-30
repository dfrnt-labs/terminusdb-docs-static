#!/usr/bin/env bash
# Create a "what-if" branch and modify Darth Vader's record
DB="${TERMINUSDB_DB:-star-wars}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

# Create the branch
curl -s -u "$AUTH" -X POST \
  "$URL/api/branch/admin/$DB/local/branch/what-if" \
  -H "Content-Type: application/json" \
  -d '{"origin": "admin/'"$DB"'/local/branch/main"}'

# Modify Vader on the branch — rewrite as redeemed Anakin
curl -s -u "$AUTH" -X PUT \
  "$URL/api/document/admin/$DB/local/branch/what-if?author=admin&message=What+if+Vader+stayed+good" \
  -H "Content-Type: application/json" \
  -d '{
    "@id": "terminusdb:///data/Person/Darth%20Vader",
    "@type": "Person",
    "name": "Anakin Skywalker",
    "side": "Light Side",
    "faction": "Jedi Order",
    "quote": "You were right about me."
  }'
