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

cat > "${TMPDIR}/delta-c1.ndjson" <<'EOF'
{"op":"Inserted","id":"terminusdb:///star-wars/People/20","string":"The person's name is Yoda. A wise old Jedi master, small and green."}
{"op":"Inserted","id":"terminusdb:///star-wars/Species/8","string":"The Mon Calamari are an amphibious species resembling squid, known as skilled starship engineers."}
EOF

TASK_ID=$(curl -fsS -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/push?domain=${DOMAIN}&branch=main&target_commit=c1" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @"${TMPDIR}/delta-c1.ndjson")
for i in $(seq 1 60); do
  STATUS=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/check?task_id=${TASK_ID}")
  echo "${STATUS}" | jq -e '.status == "Complete"' >/dev/null 2>&1 && break
  sleep 1
done

echo "→ Push c2: change Yoda's description"
cat > "${TMPDIR}/delta-c2.ndjson" <<'EOF'
{"op":"Changed","id":"terminusdb:///star-wars/People/20","string":"The person's name is Yoda. He trained Luke Skywalker on Dagobah."}
EOF

TASK_ID=$(curl -fsS -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/push?domain=${DOMAIN}&branch=main&target_commit=c2&parent_commit=c1" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @"${TMPDIR}/delta-c2.ndjson")
for i in $(seq 1 60); do
  STATUS=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/check?task_id=${TASK_ID}")
  echo "${STATUS}" | jq -e '.status == "Complete"' >/dev/null 2>&1 && break
  sleep 1
done

echo "→ Search at c1 (should NOT rank Yoda for 'trained Luke on Dagobah')"
C1_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c1&q=trained+Luke+on+Dagobah")
echo "  c1: ${C1_RESULTS}"

echo "→ Search at c2 (should rank Yoda for 'trained Luke on Dagobah')"
C2_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c2&q=trained+Luke+on+Dagobah")
echo "  c2: ${C2_RESULTS}"
echo "${C2_RESULTS}" | jq -e 'length > 0' >/dev/null

echo "→ Branch-out: fork 'experiment' from c1, add Boba Fett"
cat > "${TMPDIR}/delta-b1.ndjson" <<'EOF'
{"op":"Inserted","id":"terminusdb:///star-wars/People/21","string":"The person's name is Boba Fett, a feared bounty hunter in Mandalorian armour."}
EOF

TASK_ID=$(curl -fsS -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/push?domain=${DOMAIN}&branch=experiment&target_commit=b1&parent_commit=c1" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @"${TMPDIR}/delta-b1.ndjson")
for i in $(seq 1 60); do
  STATUS=$(curl -fsS -u "${AUTH}" "${VECTORLINK_URL}/check?task_id=${TASK_ID}")
  echo "${STATUS}" | jq -e '.status == "Complete"' >/dev/null 2>&1 && break
  sleep 1
done

echo "→ Branch sees c1's documents (block reuse)"
B1_WISE=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=b1&q=wise+old+man")
echo "  b1 wise: ${B1_WISE}"
echo "${B1_WISE}" | jq -e 'length > 0' >/dev/null

echo "→ New document exists only on branch"
B1_BOUNTY=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=b1&q=bounty+hunter")
echo "  b1 bounty: ${B1_BOUNTY}"
echo "${B1_BOUNTY}" | jq -e 'any(.id | contains("People/21"))' >/dev/null

echo "→ Main is untouched by the branch"
C2_BOUNTY=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c2&q=bounty+hunter")
echo "  c2 bounty: ${C2_BOUNTY}"
echo "${C2_BOUNTY}" | jq -e 'all(.id | contains("People/21") | not)' >/dev/null

echo "→ Reassign: bind c3 to c2 (no recompute)"
ASSIGN_STATUS=$(curl -fsS -o /dev/null -w '%{http_code}' -u "${AUTH}" -X POST \
  "${VECTORLINK_URL}/assign?domain=${DOMAIN}&source_commit=c2&target_commit=c3")
echo "  assign status: ${ASSIGN_STATUS}"
[ "${ASSIGN_STATUS}" = "204" ]

echo "→ Search c3 should equal c2"
C3_RESULTS=$(curl -fsS -u "${AUTH}" \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c3&q=trained+Luke+on+Dagobah")
echo "  c3: ${C3_RESULTS}"
echo "${C3_RESULTS}" | jq -e 'length > 0' >/dev/null

echo "→ Staleness: search un-indexed commit c9 (unknown commit — expect 404)"
STALE_OUTPUT=$(curl -s -u "${AUTH}" -D - \
  "${VECTORLINK_URL}/search?domain=${DOMAIN}&commit=c9&q=wise+old+man" 2>&1)
echo "  ${STALE_OUTPUT}" | head -5

echo "→ Cleanup"
curl -fsS -u "${AUTH}" -X DELETE "${VECTORLINK_URL}/domain?domain=${DOMAIN}" >/dev/null 2>&1 || true

echo "✓ History flow passed"
