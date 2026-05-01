FROM terminusdb/terminusdb-server:latest

# Copy bootstrap script for first-run database creation
COPY bootstrap-templates.sh /app/terminusdb/bootstrap-templates.sh
RUN chmod +x /app/terminusdb/bootstrap-templates.sh

# Copy template data (schema + instance data)
COPY templates/ /app/terminusdb/templates/

# Custom dashboard landing page (replaces generic TerminusDB page)
COPY dashboard/ /app/terminusdb/dashboard/

# Custom entrypoint: bootstrap on first run, then serve
COPY entrypoint.sh /app/terminusdb/entrypoint.sh
RUN chmod +x /app/terminusdb/entrypoint.sh

CMD ["/app/terminusdb/entrypoint.sh"]
