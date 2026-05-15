# fixture: docs-test
import os
import time
import requests
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = "py_qs_verify"

# Setup: full workflow (db, doc, branch, edit, merge)
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)
time.sleep(0.1)

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
client.branch = "main"
client.rebase(
    rebase_source=f"{team}/{db}/local/branch/feature",
    message="Merge feature: updated Jane's email",
)

# region: display
updated = client.get_document("terminusdb:///data/jane", raw_json=True)
print("Person on main after merge:", updated)
# endregion

# Cleanup
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)
