#!/bin/bash
set -e

# Runtime entrypoint: databases are baked into the image at build time.
# This script just randomises the admin password and starts TerminusDB.

STORAGE_DIR="/app/terminusdb/storage"

# Randomise admin password at runtime using Fly secret (or generate one)
if [ -n "$TERMINUSDB_ADMIN_PASS" ]; then
    /app/terminusdb/terminusdb user password admin --password "$TERMINUSDB_ADMIN_PASS"
    echo "Admin password set from TERMINUSDB_ADMIN_PASS secret."
else
    RUNTIME_PASS=$(openssl rand -base64 32)
    /app/terminusdb/terminusdb user password admin --password "$RUNTIME_PASS"
    echo "Admin password randomised (no TERMINUSDB_ADMIN_PASS set)."
fi

# Start Ollama — the embedded vectorlink engine embeds via its
# OpenAI-compatible API on localhost:11434. KEEP_ALIVE=-1 keeps the model
# resident once loaded.
export OLLAMA_KEEP_ALIVE=-1
ollama serve &
echo "Waiting for Ollama..."
until curl -sf http://localhost:11434/api/tags > /dev/null; do sleep 1; done
# Warmup embed: loads multilingual-e5-base into RAM before TDB accepts traffic
curl -sf http://localhost:11434/api/embed \
  -d '{"model":"multilingual-e5-base","input":"warmup"}' > /dev/null
echo "Ollama ready — multilingual-e5-base loaded."

# Load the docs pages into public/docs once TerminusDB accepts connections.
# Runs in the background: the loader upserts by slug, so every boot refreshes
# the content to match this image — even on a pre-existing storage volume.
# Requires TERMINUSDB_ADMIN_PASS for auth; skipped when it is unset (the admin
# password is then random and unknowable).
if [ -n "$TERMINUSDB_ADMIN_PASS" ]; then
    (
        until (echo > /dev/tcp/localhost/6363) 2>/dev/null; do sleep 1; done
        echo "Loading docs pages into public/docs..."
        node /app/terminusdb/load-docs/scripts/load-docs-to-terminusdb.mjs \
            --url http://127.0.0.1:6363 --org public --db docs \
            --user admin --password "$TERMINUSDB_ADMIN_PASS" \
            --batch-size 10000 --no-wait \
        && /app/terminusdb/terminusdb db update public/docs --public \
        && /app/terminusdb/terminusdb capability grant public    public/docs cloner \
        && /app/terminusdb/terminusdb capability grant anonymous public/docs cloner \
        && echo "public/docs loaded; public, anonymous cloner granted." \
        || echo "WARNING: docs load failed — see output above."
    ) &
else
    echo "Skipping docs load (no TERMINUSDB_ADMIN_PASS set)."
fi

# Seed the vectorlink embed cache before TerminusDB starts — the sled cache
# lets the indexer read precomputed embeddings instead of re-embedding on
# CPU. Runs before serve so no embed call can race the copy.
PRE=/app/terminusdb/precomputed
MARKER="$STORAGE_DIR/.docs-store-version"
VL_DIR="${VECTORLINK_DATA_DIR:-$STORAGE_DIR/vectorlink}"
if [ -f "$PRE/docs-store.version" ] && ! cmp -s "$PRE/docs-store.version" "$MARKER"; then
    mkdir -p "$VL_DIR"
    cp -r "$PRE/vectorlink/." "$VL_DIR/" \
    && cp "$PRE/docs-store.version" "$MARKER" \
    && echo "Embed cache seeded ($(cat "$PRE/docs-store.version"))." \
    || echo "WARNING: embed cache seeding failed — indexing will be slow."
fi

# Start TerminusDB in foreground
echo "TerminusDB running on port ${TERMINUSDB_SERVER_PORT:-6363}"
exec /app/terminusdb/terminusdb serve
