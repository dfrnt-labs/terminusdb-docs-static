#!/bin/bash
set -euo pipefail

VECTORLINK_URL="${VECTORLINK_URL:-http://localhost:7372}"
VECTORLINK_ADMIN_USER="${VECTORLINK_ADMIN_USER:-admin}"
VECTORLINK_ADMIN_SECRET="${VECTORLINK_ADMIN_SECRET:-root}"
AUTH="${VECTORLINK_ADMIN_USER}:${VECTORLINK_ADMIN_SECRET}"
DOMAIN="admin/er"

echo "→ Waiting for engine readiness"
until curl -fsS "${VECTORLINK_URL}/health/ready" | jq -e '.index and .search' >/dev/null 2>&1; do
  echo "  waiting…"; sleep 2
done
echo "  engine ready"

echo "→ Cleanup and setup: index entity resolution data at c1"
curl -fsS -u "${AUTH}" -X DELETE "${VECTORLINK_URL}/domain?domain=${DOMAIN}" >/dev/null 2>&1 || true

TMPDIR=$(mktemp -d)
trap 'rm -rf "${TMPDIR}"' EXIT

cat > "${TMPDIR}/delta.ndjson" <<'EOF'
{"op":"Inserted","id":"terminusdb:///er/Abt/1","string":"3-Piece Kitchen Set with Mixer"}
{"op":"Inserted","id":"terminusdb:///er/Abt/2","string":"Bluetooth Speaker System"}
{"op":"Inserted","id":"terminusdb:///er/Buy/1","string":"3 Piece Kitchen Mixer Set"}
{"op":"Inserted","id":"terminusdb:///er/Buy/2","string":"Wireless Bluetooth Speaker"}
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

echo "→ GET /duplicates (within-population)"
DUPS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/duplicates?domain=${DOMAIN}&commit=c1&threshold=0.5")
echo "  ${DUPS}"

echo "→ GET /duplicates (cross-set: Abt vs Buy)"
CROSS_DUPS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/duplicates?domain=${DOMAIN}&commit=c1&threshold=0.5&doc_type=Abt&target_doc_type=Buy&snippet=true")
echo "  ${CROSS_DUPS}"

echo "→ POST /candidates (raw KNN gather)"
CANDIDATES=$(curl -fsS -u "${AUTH}" -X POST "${VECTORLINK_URL}/candidates" \
  -H 'Content-Type: application/json' \
  -d '{
    "domain": "admin/er",
    "commit": "c1",
    "set_doc_types": ["Abt"],
    "target_doc_types": ["Buy"],
    "k": 5,
    "threshold_set": 0.5,
    "threshold_target": 0.5,
    "include": "content"
  }')
echo "  ${CANDIDATES}"
echo "${CANDIDATES}" | jq -e 'type == "object" and has("set_to_target")' >/dev/null

echo "→ Cleanup"
curl -fsS -u "${AUTH}" -X DELETE "${VECTORLINK_URL}/domain?domain=${DOMAIN}" >/dev/null 2>&1 || true

echo "✓ Entity resolution flow passed"
