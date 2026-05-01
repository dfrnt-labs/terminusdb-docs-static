---
tags:
  - python
  - version-control
  - how-to
  - intermediate
title: Time Travel Through your Database History
nextjs:
  metadata:
    title: Time Travel Through your Database History
    description: A guide to show to time travel through your TerminusDB projects using the Python Client.
    keywords: terminusdb, branch, commit, git for data, history, point in time, python, terminusdb python client
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-collaboration-time-travel.png
    alternates:
      canonical: https://terminusdb.org/docs/time-travel-with-python/
media: []
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB Python client installed ([installation guide](/docs/install-the-python-client/))
- A database with commit history
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have queried data at historical commits using the Python client.
{% /callout %}

Assuming you have [connected with the Python Client](/docs/connect-with-python-client/), created a database, and made a few commits, you can time travel to inspect them to see what they looked like.

## Get the commits list

You can use the Python WOQL Client Library method to get a list of branch commits. This example uses pagination to get the last 10 commits starting from the branch head -

```python
# For DFRNT Cloud
from terminusdb_client import Client
client = Client('https://dfrnt.com/api/hosted/TEAM')
client.connect(team='MyTeam', db='your_db', api_token='YOUR_API_TOKEN_HERE')
commits = client.log(count=10)
print(commits)

# For TerminusDB (local)
from terminusdb_client import Client
client = Client('http://localhost:6363')
client.connect(key='root', user='admin', team='admin', db='your_db')
commits = client.log(count=10)
print(commits)
```

A response example will be a list of objects like this:

```json
{
  "@id":"InitialCommit/hpl18q42dbnab4vzq8me4bg1xn8p2a0",
  "@type":"InitialCommit",
  "author":"system",
  "identifier":"hpl18q42dbnab4vzq8me4bg1xn8p2a0",
  "message":"create initial schema",
  "schema":"layer_data:Layer_4234adfe377fa9563a17ad764ac37f5dcb14de13668ea725ef0748248229a91b",
  "timestamp":1660919664.9129035
}
```

## Time travel and point the client to a specific commit

To travel back in time to a particular commit, you need to specify the commit ID in the ref property. To obtain the commit ID, refer to the code snippet above. All your calls after will be made for this commit.

```python
client.ref = "hpl18q42dbnab4vzq8me4bg1xn8p2a0"
docs = client.get_all_documents()
```