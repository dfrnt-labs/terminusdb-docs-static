##############################################################################
# Stage 1: Build — install Node.js, run bootstrap, produce TDB storage
##############################################################################
FROM terminusdb/terminusdb-server:latest AS builder

# Install Node.js for the seed script (tdb-example-mydb requires complex commit history)
RUN apt-get update && \
    apt-get install -y --no-install-recommends nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Copy bootstrap scripts
COPY bootstrap-templates.sh /app/terminusdb/bootstrap-templates.sh
COPY build-bootstrap.sh /app/terminusdb/build-bootstrap.sh
RUN chmod +x /app/terminusdb/bootstrap-templates.sh \
             /app/terminusdb/build-bootstrap.sh

# Template data: JSON schemas, instance data, and bundles
COPY templates/ /app/terminusdb/templates/

# Seed script + dependencies for tdb-example-mydb
COPY seed/ /app/terminusdb/seed/
RUN cd /app/terminusdb/seed && npm install --omit=dev

# Run full bootstrap: initialise store, start TDB, load all 6 databases, stop TDB.
# The resulting /app/terminusdb/storage/ contains all baked-in data.
RUN /app/terminusdb/build-bootstrap.sh

##############################################################################
# Stage 2: Runtime — clean image with only TDB + baked-in storage
##############################################################################
FROM terminusdb/terminusdb-server:latest

# Copy the fully provisioned storage from the builder stage
COPY --from=builder /app/terminusdb/storage/ /app/terminusdb/storage/

# Utility scripts (for manual SSH operations)
COPY setup-sandbox-db.sh /app/terminusdb/setup-sandbox-db.sh
RUN chmod +x /app/terminusdb/setup-sandbox-db.sh

# Custom dashboard landing page
COPY dashboard/ /app/terminusdb/dashboard/

# Custom entrypoint: just start TerminusDB (bootstrap already baked in)
COPY entrypoint.sh /app/terminusdb/entrypoint.sh
RUN chmod +x /app/terminusdb/entrypoint.sh

CMD ["/app/terminusdb/entrypoint.sh"]
