#!/usr/bin/env bash
# Query characters who appear in "A New Hope" (Episode IV)
DB="${TERMINUSDB_DB:-star-wars}"
URL="${TERMINUSDB_URL:-http://localhost:6363}"
AUTH="${TERMINUSDB_USER:-admin}:${TERMINUSDB_KEY:-root}"

curl -s -u "$AUTH" -X POST \
  "$URL/api/woql/admin/$DB/local/branch/main" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "@type": "And",
      "and": [
        {
          "@type": "Triple",
          "subject": {"@type": "NodeValue", "variable": "Film"},
          "predicate": {"@type": "NodeValue", "node": "title"},
          "object": {"@type": "DataValue", "data": "A New Hope"}
        },
        {
          "@type": "Triple",
          "subject": {"@type": "NodeValue", "variable": "Film"},
          "predicate": {"@type": "NodeValue", "node": "characters"},
          "object": {"@type": "NodeValue", "variable": "Character"}
        },
        {
          "@type": "Triple",
          "subject": {"@type": "NodeValue", "variable": "Character"},
          "predicate": {"@type": "NodeValue", "node": "name"},
          "object": {"@type": "DataValue", "variable": "CharacterName"}
        }
      ]
    }
  }'
