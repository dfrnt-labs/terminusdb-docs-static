---
title: Cloning a Database with the Python Client
nextjs:
  metadata:
    title: Cloning a Database with the Python Client
    description: A guide to show how to clone a database using the Python Client.
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-collaboration-clone.png
    alternates:
      canonical: https://terminusdb.org/docs/clone-a-database-with-python/
media: []
---

# Clone a Database with the Python Client

> Before starting, you should create an account on the DFRNT TerminusDB cloud and get an API Token. You can read about this [here](/docs/how-to-connect-terminuscms/).

This how-to will show how to clone a public database from the DFRNT TerminusDB cloud into your own DFRNT team.

## Running the Python client with the API Token

Be sure to construct the Python client object first, and set the appropriate authentication token.

```python
from terminusdb_client import Client
client = Client('https://dfrnt.com/api/hosted/01234-MyUser')
client.connect(team='MyTeam', api_token='YOUR_API_TOKEN_HERE')
```

## Cloning the database

Check the TerminusDB dashboard for a database that you want to clone. In this how-to, we will be using the Lego database as an example.

```python
clone_url = 'https://dfrnt.com/api/hosted/terminusdb_demo/lego'
client.clonedb(clone_url, 'my_lego', remote_auth={'type': 'token': 'key': 'YOUR_API_TOKEN_HERE'})
```

You now have the my\_lego database cloned in your DFRNT team.

To verify whether the database has been successfully cloned, you can run:

```python
client.get_database('my_lego')
```