#!/usr/bin/env bash
# Regenerates infra/public-data-server/precomputed/ — the vectorlink
# embed_cache baked into the image so production indexing reads embeddings
# from sled cache instead of re-embedding on CPU.
#
# Prerequisite: a fully indexed local public/docs, e.g. the test container
# on port 6599 (run entrypoint.sh flow locally, wait for
# /api/index/public/docs to show searchable_documents == total_documents).
#
# Usage: infra/public-data-server/precompute-embed-cache.sh [CONTAINER_ID]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="$REPO_ROOT/infra/public-data-server/precomputed"

if [ $# -ge 1 ]; then
    CID="$1"
else
    CID="$(docker ps -q --filter publish=6599 | head -1)"
fi
[ -n "$CID" ] || { echo "No container found — pass a container id." >&2; exit 1; }

echo "Verifying index completeness in $CID..."
docker exec "$CID" curl -sf http://localhost:6363/api/index/public/docs \
  | grep -q '"searchable_documents": *[1-9]' \
  || { echo "Index not complete yet — aborting." >&2; exit 1; }

rm -rf "$OUT_DIR/vectorlink"
mkdir -p "$OUT_DIR/vectorlink"
docker cp "$CID:/app/terminusdb/storage/vectorlink/embed_cache" \
    "$OUT_DIR/vectorlink/"

find "$OUT_DIR" -type f ! -name docs-store.version | sort \
  | xargs shasum -a 256 | shasum -a 256 | cut -d' ' -f1 \
  > "$OUT_DIR/docs-store.version"

echo "Wrote $OUT_DIR (version $(cat "$OUT_DIR/docs-store.version"))"
echo "Commit this directory to ship the refreshed cache."
