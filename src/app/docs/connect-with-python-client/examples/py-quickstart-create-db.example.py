# fixture: docs-test
import os
import requests
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = "py_qs_create"

# Setup: delete DB if it exists (idempotent)
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)

client = Client(server)
client.connect(team=team, key=key)

# region: display
client.create_database(db, label=db, description="Python quickstart", include_schema=False)

result = client.insert_document(
    {"@id": "terminusdb:///data/jane", "name": "Jane Smith", "email": "jane@example.com", "age": 30},
    raw_json=True,
    commit_msg="Add Jane Smith",
)

print("Document created:", result)
# endregion

# Cleanup
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)
