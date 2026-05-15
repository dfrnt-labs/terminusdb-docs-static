# fixture: docs-test
import os
import requests
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = "py_qs_branch"

# Setup: delete DB if it exists, create fresh with a document
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)

client = Client(server)
client.connect(team=team, key=key)

client.create_database(db, label=db, description="Python quickstart", include_schema=False)
client.insert_document(
    {"@id": "terminusdb:///data/jane", "name": "Jane Smith", "email": "jane@example.com", "age": 30},
    raw_json=True,
    commit_msg="Add Jane Smith",
)

# region: display
# Create a new branch from the current branch (main)
client.create_branch("feature")

# Switch to it
client.branch = "feature"

print("Now on branch:", client.branch)
# endregion

# Cleanup
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)
