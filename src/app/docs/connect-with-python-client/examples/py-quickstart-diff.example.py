# fixture: docs-test
import os
import json
import requests
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = "py_qs_diff"

# Setup: delete DB if it exists, create with document, branch, and edit
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
# Compare main to feature — what changed?
diff = client.diff_version("main", "feature")

print("Changes between main and feature:")
print(json.dumps(diff, indent=2))
# endregion

# Cleanup
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)
