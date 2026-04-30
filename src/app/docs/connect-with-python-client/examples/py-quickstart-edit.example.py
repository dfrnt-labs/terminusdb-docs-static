import os
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = os.environ.get("TERMINUSDB_DB", "MyDatabase")

client = Client(server)
client.connect(team=team, key=key, db=db, branch="feature")

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
