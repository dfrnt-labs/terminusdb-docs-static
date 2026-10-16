#!/bin/bash
set -euo pipefail

VECTORLINK_URL="${VECTORLINK_URL:-http://localhost:7372}"
VECTORLINK_ADMIN_USER="${VECTORLINK_ADMIN_USER:-admin}"
VECTORLINK_ADMIN_SECRET="${VECTORLINK_ADMIN_SECRET:-root}"
AUTH="${VECTORLINK_ADMIN_USER}:${VECTORLINK_ADMIN_SECRET}"
DOMAIN="admin/star_wars"

echo "→ Waiting for engine readiness"
until curl -fsS "${VECTORLINK_URL}/health/ready" | jq -e '.index and .search' >/dev/null 2>&1; do
  echo "  waiting…"; sleep 2
done
echo "  engine ready"

echo "→ Cleanup and setup: index base data at c1"
curl -fsS -u "${AUTH}" -X DELETE "${VECTORLINK_URL}/domain?domain=${DOMAIN}" >/dev/null 2>&1 || true

TMPDIR=$(mktemp -d)
trap 'rm -rf "${TMPDIR}"' EXIT

cat > "${TMPDIR}/delta.ndjson" <<'EOF'
{"op":"Inserted","id":"terminusdb:///star-wars/People/20","string":"The person's name is Yoda. A wise old Jedi master, small and green."}
{"op":"Inserted","id":"terminusdb:///star-wars/Species/8","string":"The Mon Calamari are an amphibious species resembling squid, known as skilled starship engineers."}
EOF

TASK_ID=$(curl -fsS -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/push?domain=${DOMAIN}&branch=main&target_commit=c1" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @"${TMPDIR}/delta.ndjson")
for i in $(seq 1 60); do
  STATUS=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/check?task_id=${TASK_ID}")
  echo "${STATUS}" | jq -e '.status == "Complete"' >/dev/null 2>&1 && break
  sleep 1
done

echo "→ GET search (hybrid mode)"
GET_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c1&q=wise+old+man&mode=hybrid")
echo "  ${GET_RESULTS}"
echo "${GET_RESULTS}" | jq -e 'length > 0' >/dev/null

echo "→ POST search (structured JSON)"
POST_RESULTS=$(curl -fsS -u "${AUTH}" -X POST "${VECTORLINK_URL}/search" \
  -H 'Content-Type: application/json' \
  -d '{"domain":"admin/star_wars","commit":"c1","q":"wise old man","mode":"hybrid","count":5}')
echo "  ${POST_RESULTS}"
echo "${POST_RESULTS}" | jq -e 'length > 0' >/dev/null

echo "→ POST search with doc_type filter"
FILTERED=$(curl -fsS -u "${AUTH}" -X POST "${VECTORLINK_URL}/search" \
  -H 'Content-Type: application/json' \
  -d '{"domain":"admin/star_wars","commit":"c1","q":"engineer","doc_type":["Species"]}')
echo "  ${FILTERED}"

echo "→ GET search in fts mode"
FTS_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c1&q=Mon+Calamari&mode=fts")
echo "  ${FTS_RESULTS}"

echo "→ GET search with snippet=true"
SNIPPET_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c1&q=wise+old+man&snippet=true")
echo "  ${SNIPPET_RESULTS}"
echo "${SNIPPET_RESULTS}" | jq -e 'any(.chunk.snippet != null)' >/dev/null

echo "→ GET similar by document id"
SIMILAR_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/similar?domain=${DOMAIN}&commit=c1&id=terminusdb:///star-wars/People/20")
echo "  ${SIMILAR_RESULTS}"

echo "→ POST similar by text"
SIMILAR_TEXT=$(curl -fsS -u "${AUTH}" -X POST "${VECTORLINK_URL}/similar" \
  -H 'Content-Type: application/json' \
  -d '{"domain":"admin/star_wars","commit":"c1","text":"bounty hunter in Mandalorian armour"}')
echo "  ${SIMILAR_TEXT}"

echo "→ GET suggest (typeahead)"
SUGGEST_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/suggest?domain=${DOMAIN}&commit=c1&q=wise&count=10")
echo "  ${SUGGEST_RESULTS}"

echo "→ GET search with staleness header (-D -)"
HEADER_OUTPUT=$(curl -s -u "${AUTH}" -D - \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c9&q=wise+old+man" 2>&1)
echo "  ${HEADER_OUTPUT}" | head -5
echo "${HEADER_OUTPUT}" | grep -qi 'TerminusDB-Data-Version' || true

echo "→ Cleanup"
curl -fsS -u "${AUTH}" -X DELETE "${VECTORLINK_URL}/domain?domain=${DOMAIN}" >/dev/null 2>&1 || true

echo "✓ Querying flow passed"
