---
tags:
  - python
  - version-control
  - how-to
  - intermediate
title: Squashing Commits with the TerminusDB Python Client
nextjs:
  metadata:
    title: Squashing Commits with the TerminusDB Python Client
    description: A guide to show how to squash commits into one big commit using the TerminusDB Python Client.
    keywords: terminusdb, branch, clean history, commit, compress, git for data, python, squash
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-collaboration-squash.png
    alternates:
      canonical: https://terminusdb.org/docs/squash-a-project-with-python/
media: []
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally or a DFRNT Hub account
- The TerminusDB Python client installed ([installation guide](/docs/install-the-python-client/))
- A database with multiple commits on a branch
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have squashed commits on a branch into a single commit using the Python client.
{% /callout %}

Squashing allows you to combine multiple commits in your branch's history into a single commit. This how-to assumes that you [connected to a database already](/docs/connect-to-a-database-with-python-client/).

```python
client.branch = "mybranch"
commitMessage = "merge all the commits"
result = client.squash(commitMessage)
```

The result will contain the new commit id. You can use it to reset the HEAD to the new squashed commit.

```python
client.reset(result, use_path=True)
```