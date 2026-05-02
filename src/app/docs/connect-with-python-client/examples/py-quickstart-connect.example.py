# region: display
import os
from terminusdb_client import Client

client = Client(os.environ.get("TERMINUSDB_URL", "http://localhost:6363"))
client.connect(
    team=os.environ.get("TERMINUSDB_USER", "admin"),
    key=os.environ.get("TERMINUSDB_KEY", "root"),
)

info = client.info()
print("Connected to TerminusDB", info)
# endregion
