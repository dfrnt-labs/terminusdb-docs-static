##############################################################################
# Stage 1: Build — install Node.js, run bootstrap, produce TDB storage
##############################################################################
# Build context is the REPOSITORY ROOT (the docs loader needs src/app/docs,
# scripts/ and schema/). Deploy with:
#   fly deploy -c infra/public-data-server/fly.toml \
#              --dockerfile infra/public-data-server/Dockerfile
FROM terminusdb/terminusdb-server:12.1-rc AS builder

# Install Node.js for the seed script (tdb-example-mydb requires complex commit history)
RUN apt-get update && \
    apt-get install -y --no-install-recommends nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Copy bootstrap scripts
COPY infra/public-data-server/bootstrap-templates.sh /app/terminusdb/bootstrap-templates.sh
COPY infra/public-data-server/build-bootstrap.sh /app/terminusdb/build-bootstrap.sh
RUN chmod +x /app/terminusdb/bootstrap-templates.sh \
             /app/terminusdb/build-bootstrap.sh

# Template data: JSON schemas, instance data, and bundles
COPY infra/public-data-server/templates/ /app/terminusdb/templates/

# Seed script + dependencies for tdb-example-mydb
COPY infra/public-data-server/seed/ /app/terminusdb/seed/
RUN cd /app/terminusdb/seed && npm install --omit=dev

# Run full bootstrap: initialise store, start TDB, load all 6 databases, stop TDB.
# The resulting /app/terminusdb/storage/ contains all baked-in data.
RUN /app/terminusdb/build-bootstrap.sh

##############################################################################
# Stage 2: Runtime — TDB + baked storage + Ollama + docs loader
##############################################################################
FROM ollama/ollama:latest AS ollama-src

FROM terminusdb/terminusdb-server:12.1-rc

# Copy the fully provisioned storage from the builder stage
COPY --from=builder /app/terminusdb/storage/ /app/terminusdb/storage/

# curl (readiness checks, model pull, tokenizer fetch — not in the base image)
# and Node.js for the docs loader (runs at container start — a few hundred
# pages, upserted by slug so each deploy refreshes content even on the old
# volume).
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Ollama for the embedded vectorlink engine (embeds via its OpenAI-compatible
# API on localhost:11434). CPU-only is sufficient for multilingual-e5-base.
COPY --from=ollama-src /usr/bin/ollama /usr/bin/ollama
COPY --from=ollama-src /usr/lib/ollama /usr/lib/ollama

# Pre-pull the embedding model at build time so it is present at first boot —
# no runtime download, and the entrypoint warmup loads it into RAM immediately.
RUN ollama serve & pid=$!; \
    until curl -sf http://localhost:11434/api/tags > /dev/null; do sleep 1; done; \
    ollama pull hf.co/vectorlink/multilingual-e5-base-GGUF:q8_0 && \
    ollama cp hf.co/vectorlink/multilingual-e5-base-GGUF:q8_0 multilingual-e5-base; \
    status=$?; kill $pid; wait $pid 2>/dev/null; exit $status

# XLM-RoBERTa tokenizer required by the embedded vectorlink engine
RUN curl -fsSL https://huggingface.co/intfloat/multilingual-e5-base/resolve/main/tokenizer.json \
      -o /app/terminusdb/e5-tokenizer.json

# Docs loader + schema + page sources. The script resolves ROOT as the parent
# of scripts/, so keep this layout: load-docs/{scripts,schema,src/app/docs}.
COPY scripts/load-docs-to-terminusdb.mjs /app/terminusdb/load-docs/scripts/
COPY schema/docs-page.tdb.json schema/docs-page.query.graphql schema/docs-page.template.hbs \
     /app/terminusdb/load-docs/schema/
COPY src/app/docs/ /app/terminusdb/load-docs/src/app/docs/
RUN cd /app/terminusdb/load-docs && npm install --omit=dev "js-yaml@^4.1.0"

# Utility scripts (for manual SSH operations)
COPY infra/public-data-server/setup-sandbox-db.sh /app/terminusdb/setup-sandbox-db.sh
RUN chmod +x /app/terminusdb/setup-sandbox-db.sh

# Custom dashboard landing page
COPY infra/public-data-server/dashboard/ /app/terminusdb/dashboard/

# Custom entrypoint: Ollama + docs load + TerminusDB (bootstrap already baked in)
COPY infra/public-data-server/entrypoint.sh /app/terminusdb/entrypoint.sh
RUN chmod +x /app/terminusdb/entrypoint.sh

# Precomputed vectorlink embed cache — LAST layer: it changes on every
# docs refresh, so keeping it at the end preserves the cache above.
COPY infra/public-data-server/precomputed/ /app/terminusdb/precomputed/

CMD ["/app/terminusdb/entrypoint.sh"]
