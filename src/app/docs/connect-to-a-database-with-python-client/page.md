---
title: Connect to a Database using the Python Client
nextjs:
  metadata:
    title: Connect to a Database using the Python Client
    description: A guide to show how to connect to a TerminusDB project using the Python client.
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-connect-database.png
    alternates:
      canonical: https://terminusdb.org/docs/connect-to-a-database-with-python-client/
media: []
---

## TerminusDB

If you have created a Team in DFRNT TerminusDB cloud, and put an [API key](/docs/how-to-connect-terminuscms/) in your environment you can connect to an existing database in the following way:

```python
team = "MyTeam",
client.connect(db="nuclear", team=team, use_token=True)
```

## TerminusDB

You can connect to a database with basic authorization just by using the `connect` member function.

```python
team = "MyTeam",
client.connect(db="nuclear")
```

If you want to connect as a specific user and with a specific password, you can pass them here:

```python
team = "MyTeam",
client.connect(db="nuclear", team=team, key="your_password")
```