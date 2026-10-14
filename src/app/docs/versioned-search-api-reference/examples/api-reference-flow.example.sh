#!/bin/bash
set -euo pipefail

VECTORLINK_URL="${VECTORLINK_URL:-http://localhost:7372}"
VECTORLINK_ADMIN_USER="${VECTORLINK_ADMIN_USER:-admin}"
VECTORLINK_ADMIN_SECRET="${VECTORLINK_ADMIN_SECRET:-root}"
AUTH="${VECTORLINK_ADMIN_USER}:${VECTORLINK_ADMIN_SECRET}"
DOMAIN="admin/star_wars"

echo "→ Health: liveness (no auth)"
LIVE=$(curl -fsS "${VECTORLINK_URL}/health/live")
echo "  ${LIVE}"
echo "${LIVE}" | jq -e '.status == "ok"' >/dev/null

echo "→ Health: readiness (no auth)"
READY=$(curl -fsS "${VECTORLINK_URL}/health/ready")
echo "  ${READY}"
echo "${READY}" | jq -e '.ready == true' >/dev/null

echo "→ Cleanup and setup: index base data at c1"
curl -fsS -u "${AUTH}" -X DELETE "${VECTORLINK_URL}/domain?domain=${DOMAIN}" >/dev/null 2>&1 || true

TMPDIR=$(mktemp -d)
trap 'rm -rf "${TMPDIR}"' EXIT

cat > "${TMPDIR}/delta.ndjson" <<'EOF'
{"op":"Inserted","id":"terminusdb:///star-wars/People/20","string":"The person's name is Yoda. A wise old Jedi master, small and green."}
{"op":"Inserted","id":"terminusdb:///star-wars/Species/8","string":"The Mon Calamari are an amphibious species resembling squid, known as skilled starship engineers."}
EOF

echo "→ GET /last-indexed (before indexing)"
LI=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/last-indexed?domain=${DOMAIN}&branch=main")
echo "  ${LI}"

echo "→ POST /push"
TASK_ID=$(curl -fsS -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/push?domain=${DOMAIN}&branch=main&target_commit=c1" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @"${TMPDIR}/delta.ndjson")
echo "  task_id: ${TASK_ID}"

echo "→ GET /check"
for i in $(seq 1 60); do
  STATUS=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/check?task_id=${TASK_ID}")
  echo "  ${STATUS}"
  echo "${STATUS}" | jq -e '.status == "Complete"' >/dev/null 2>&1 && break
  sleep 1
done

echo "→ POST /assign"
ASSIGN_STATUS=$(curl -fsS -o /dev/null -w '%{http_code}' -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/assign?domain=${DOMAIN}&source_commit=c1&target_commit=c3")
echo "  status: ${ASSIGN_STATUS}"
[ "${ASSIGN_STATUS}" = "204" ]

echo "→ GET /search"
SEARCH_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c1&q=wise+old+man")
echo "  ${SEARCH_RESULTS}"
echo "${SEARCH_RESULTS}" | jq -e 'length > 0' >/dev/null

echo "→ POST /search"
POST_SEARCH=$(curl -fsS -u "${AUTH}" -X POST "${VECTORLINK_URL}/search" \
  -H 'Content-Type: application/json' \
  -d '{"domain":"admin/star_wars","commit":"c1","q":"wise old man","mode":"hybrid","count":5}')
echo "  ${POST_SEARCH}"

echo "→ GET /similar"
SIMILAR=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/similar?domain=${DOMAIN}&commit=c1&id=terminusdb:///star-wars/People/20")
echo "  ${SIMILAR}"

echo "→ POST /similar"
SIMILAR_POST=$(curl -fsS -u "${AUTH}" -X POST "${VECTORLINK_URL}/similar" \
  -H 'Content-Type: application/json' \
  -d '{"domain":"admin/star_wars","commit":"c1","text":"bounty hunter"}')
echo "  ${SIMILAR_POST}"

echo "→ GET /duplicates"
DUPS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/duplicates?domain=${DOMAIN}&commit=c1&threshold=0.5")
echo "  ${DUPS}"

echo "→ GET /suggest"
SUGGEST=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/suggest?domain=${DOMAIN}&commit=c1&q=wise&count=10")
echo "  ${SUGGEST}"

echo "→ POST /compare"
COMPARE=$(curl -fsS -u "${AUTH}" -X POST "${VECTORLINK_URL}/compare?method=embedding" \
  -H 'Content-Type: application/json' \
  -d '{"source":"wise old Jedi master","target":"ancient Jedi teacher"}')
echo "  ${COMPARE}"
echo "${COMPARE}" | jq -e 'has("distance")' >/dev/null

echo "→ GET /statistics"
STATS=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/statistics")
echo "  ${STATS}"
echo "${STATS}" | jq -e 'has("domains")' >/dev/null

echo "→ DELETE /domain"
DEL_STATUS=$(curl -fsS -o /dev/null -w '%{http_code}' -u "${AUTH}" -X DELETE \
  "${VECTORLINK_URL}/domain?domain=${DOMAIN}")
echo "  status: ${DEL_STATUS}"
[ "${DEL_STATUS}" = "204" ]

echo "✓ API reference flow passed"
