# fixture: docs-test
import os
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")

client = Client(server)
client.connect(team=team, key=key)

db = os.environ.get("TERMINUSDB_DB", "MyDatabase")

client.create_database(db, label=db, description="Python quickstart", schema=False)

result = client.insert_document(
    {"@id": "terminusdb:///data/jane", "name": "Jane Smith", "email": "jane@example.com", "age": 30},
    raw_json=True,
    commit_msg="Add Jane Smith",
)

print("Document created:", result)
