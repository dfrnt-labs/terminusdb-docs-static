---
title: Squashing Commits with the TerminusDB Python Client
nextjs:
  metadata:
    title: Squashing Commits with the TerminusDB Python Client
    description: A guide to show how to squash commits into one big commit using the TerminusDB Python Client.
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-collaboration-squash.png
    alternates:
      canonical: https://terminusdb.org/docs/squash-a-project-with-python/
media: []
---

Squashing allows you to combine multiple commits in your branch's history into a single commit. This how-to assumes that you [connected to a database already](/docs/connect-to-a-database-with-python-client/).

```python
client.branch = "mybranch"
commitMessage = "merge all the commits"
result = client.squash(commitMessage)
```

The result will contain the new commit id. You can use it to reset the HEAD to the new squashed commit.

```python
client.reset(result)
```