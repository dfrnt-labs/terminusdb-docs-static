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

echo "→ Cleanup: delete any existing domain"
curl -fsS -u "${AUTH}" -X DELETE "${VECTORLINK_URL}/domain?domain=${DOMAIN}" >/dev/null 2>&1 || true

echo "→ Check last-indexed (should be empty)"
RESP=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/last-indexed?domain=${DOMAIN}&branch=main")
echo "  ${RESP}"

echo "→ Create NDJSON delta"
TMPDIR=$(mktemp -d)
cat > "${TMPDIR}/delta.ndjson" <<'EOF'
{"op":"Inserted","id":"terminusdb:///star-wars/People/20","string":"This person is named Yoda. A wise old Jedi master, small and green."}
{"op":"Inserted","id":"terminusdb:///star-wars/Species/8","string":"The Mon Calamari are an amphibious species resembling squid, known as skilled starship engineers."}
EOF

echo "→ Push delta as commit c1"
TASK_ID=$(curl -fsS -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/push?domain=${DOMAIN}&branch=main&target_commit=c1" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @"${TMPDIR}/delta.ndjson")
echo "  task_id: ${TASK_ID}"

echo "→ Poll /check until complete"
for i in $(seq 1 60); do
  STATUS=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/check?task_id=${TASK_ID}")
  echo "  ${STATUS}"
  echo "${STATUS}" | jq -e '.status == "Complete"' >/dev/null 2>&1 && break
  sleep 1
done

echo "→ Search GET (wise old man)"
GET_RESULTS=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c1&q=wise+old+man")
echo "  ${GET_RESULTS}"
echo "${GET_RESULTS}" | jq -e 'length > 0' >/dev/null

echo "→ Search POST (squid people)"
POST_RESULTS=$(curl -fsS -u "${AUTH}" -X POST "${VECTORLINK_URL}/search" \
  -H 'Content-Type: application/json' \
  -d '{"domain":"admin/star_wars","commit":"c1","q":"who are the squid people"}')
echo "  ${POST_RESULTS}"
echo "${POST_RESULTS}" | jq -e 'length > 0' >/dev/null

echo "→ Cleanup"
curl -fsS -u "${AUTH}" -X DELETE "${VECTORLINK_URL}/domain?domain=${DOMAIN}" >/dev/null 2>&1 || true
rm -rf "${TMPDIR}"

echo "✓ Quickstart flow passed"
