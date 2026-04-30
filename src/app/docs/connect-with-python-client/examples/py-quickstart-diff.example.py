import os
import json
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = os.environ.get("TERMINUSDB_DB", "MyDatabase")

client = Client(server)
client.connect(team=team, key=key, db=db)

# Compare main to feature — what changed?
diff = client.diff_version(
    f"{team}/{db}/local/branch/main",
    f"{team}/{db}/local/branch/feature",
)

print("Changes between main and feature:")
print(json.dumps(diff, indent=2))
