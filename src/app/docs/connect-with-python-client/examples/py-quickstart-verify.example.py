import os
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = os.environ.get("TERMINUSDB_DB", "MyDatabase")

client = Client(server)
client.connect(team=team, key=key, db=db)

updated = client.get_document("terminusdb:///data/jane", raw_json=True)
print("Person on main after merge:", updated)
