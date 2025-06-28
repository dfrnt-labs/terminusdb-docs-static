---
title: Install the TerminusDB Python Client
nextjs:
  metadata:
    title: Install the TerminusDB Python Client
    description: A guide showing how to install the TerminusDB Client.
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-install-python-client.png
    alternates:
      canonical: https://terminusdb.org/docs/install-the-python-client/
media: []
---

It is recommended that you install the TerminusDB Python client (which works with [Python >= 3.7](https://www.python.org/downloads)) in a [separate Python environment](https://docs.python.org/3/tutorial/venv.html). For example, if we use `venv` which comes with standard installation of Python 3.

First we create a new environment:

```bash
$ python3 -m venv ~/.virtualenvs/terminusdb
$ source ~/.virtualenvs/terminusdb/bin/activate
```

Then we can install using pip:

```bash
$ python3 -m pip install terminusdb-client
```