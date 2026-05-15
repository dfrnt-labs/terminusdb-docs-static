# fixture: docs-test
import os
import requests
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = "py_qs_merge"

# Setup: delete DB if it exists, create full workflow (db, doc, branch, edit)
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
client.create_branch("feature")
client.branch = "feature"
client.replace_document(
    {"@id": "terminusdb:///data/jane", "name": "Jane Smith", "email": "jane.smith@company.com", "age": 30},
    raw_json=True,
    commit_msg="Updated Jane's email",
)

# region: display
# Switch back to main
client.branch = "main"

# Merge feature into main (like git merge)
client.rebase(
    rebase_source=f"{team}/{db}/local/branch/feature",
    message="Merge feature: updated Jane's email",
)

print("Merged feature into main")
# endregion

# Cleanup
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)
