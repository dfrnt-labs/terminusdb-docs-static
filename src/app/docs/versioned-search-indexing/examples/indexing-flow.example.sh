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

TMPDIR=$(mktemp -d)
trap 'rm -rf "${TMPDIR}"' EXIT

echo "→ Check last-indexed (should be null/empty)"
RESP=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/last-indexed?domain=${DOMAIN}&branch=main")
echo "  ${RESP}"
echo "${RESP}" | jq -e '.commit == null' >/dev/null

echo "→ Create NDJSON delta"
cat > "${TMPDIR}/delta.ndjson" <<'EOF'
{"op":"Inserted","id":"terminusdb:///star-wars/People/20","string":"The person's name is Yoda. A wise old Jedi master, small and green."}
{"op":"Inserted","id":"terminusdb:///star-wars/Species/8","string":"The Mon Calamari are an amphibious species resembling squid, known as skilled starship engineers."}
EOF

echo "→ Push delta as commit c1 (no parent — first index)"
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

echo "→ Check last-indexed again (should show c1)"
RESP=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/last-indexed?domain=${DOMAIN}&branch=main")
echo "  ${RESP}"
echo "${RESP}" | jq -e '.commit == "c1"' >/dev/null

echo "→ Reassign: bind c3 to c1's snapshot (no recompute)"
ASSIGN_STATUS=$(curl -fsS -o /dev/null -w '%{http_code}' -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/assign?domain=${DOMAIN}&source_commit=c1&target_commit=c3")
echo "  assign status: ${ASSIGN_STATUS}"
[ "${ASSIGN_STATUS}" = "204" ]

echo "→ Delete domain (cleanup)"
DEL_STATUS=$(curl -fsS -o /dev/null -w '%{http_code}' -u "${AUTH}" -X DELETE \
  "${VECTORLINK_URL}/domain?domain=${DOMAIN}")
echo "  delete status: ${DEL_STATUS}"
[ "${DEL_STATUS}" = "204" ]

echo "→ Delete again (idempotent — should still succeed)"
DEL_STATUS2=$(curl -fsS -o /dev/null -w '%{http_code}' -u "${AUTH}" -X DELETE \
  "${VECTORLINK_URL}/domain?domain=${DOMAIN}")
echo "  delete status: ${DEL_STATUS2}"
[ "${DEL_STATUS2}" = "204" ]

echo "✓ Indexing flow passed"
