FROM terminusdb/terminusdb-server:latest

# Install Node.js for the seed script (tdb-example-mydb requires complex commit history)
RUN apt-get update && \
    apt-get install -y --no-install-recommends nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Copy bootstrap scripts and all data dependencies
COPY bootstrap-templates.sh /app/terminusdb/bootstrap-templates.sh
COPY build-bootstrap.sh /app/terminusdb/build-bootstrap.sh
COPY setup-sandbox-db.sh /app/terminusdb/setup-sandbox-db.sh
RUN chmod +x /app/terminusdb/bootstrap-templates.sh \
             /app/terminusdb/build-bootstrap.sh \
             /app/terminusdb/setup-sandbox-db.sh

# Template data: JSON schemas, instance data, and bundles
COPY templates/ /app/terminusdb/templates/

# Custom dashboard landing page
COPY dashboard/ /app/terminusdb/dashboard/

# Seed script + dependencies for tdb-example-mydb
COPY seed/ /app/terminusdb/seed/
RUN cd /app/terminusdb/seed && npm install --omit=dev

# Run bootstrap at build time: initialise store, start TDB, load all databases
# (including tdb-example-mydb via seed script), then stop TDB.
# The resulting storage directory is baked into the image layer.
RUN /app/terminusdb/build-bootstrap.sh

# Remove Node.js and seed artifacts (not needed at runtime)
RUN apt-get purge -y nodejs npm && \
    apt-get autoremove -y && \
    rm -rf /app/terminusdb/seed /root/.npm

# Custom entrypoint: just start TerminusDB (bootstrap already baked in)
COPY entrypoint.sh /app/terminusdb/entrypoint.sh
RUN chmod +x /app/terminusdb/entrypoint.sh

CMD ["/app/terminusdb/entrypoint.sh"]
