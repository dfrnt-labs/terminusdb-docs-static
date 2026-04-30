import os
from terminusdb_client import Client

server = os.environ.get("TERMINUSDB_URL", "http://localhost:6363")
key = os.environ.get("TERMINUSDB_KEY", "root")
team = os.environ.get("TERMINUSDB_USER", "admin")
db = os.environ.get("TERMINUSDB_DB", "MyDatabase")

client = Client(server)
client.connect(team=team, key=key, db=db)

# Switch back to main
client.branch = "main"

# Merge feature into main (like git merge)
client.rebase(
    rebase_source=f"{team}/{db}/local/branch/feature",
    message="Merge feature: updated Jane's email",
)

print("Merged feature into main")
