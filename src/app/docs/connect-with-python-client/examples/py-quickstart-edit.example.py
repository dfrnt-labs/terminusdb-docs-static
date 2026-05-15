# fixture: docs-test
import os
import requests
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = "py_qs_edit"

# Setup: delete DB if it exists, create with document and branch
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

# region: display
# Get the document we inserted earlier
person = client.get_document("terminusdb:///data/jane", raw_json=True)
print("Current document:", person)

# Update the email on this branch
client.replace_document(
    {"@id": "terminusdb:///data/jane", "name": "Jane Smith", "email": "jane.smith@company.com", "age": 30},
    raw_json=True,
    commit_msg="Updated Jane's email",
)

print("Document updated on feature branch")
# endregion

# Cleanup
requests.delete(
    f"{server}/api/db/{team}/{db}?force=true",
    auth=(team, key),
)
