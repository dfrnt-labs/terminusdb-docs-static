---
tags:
  - how-to
  - installation
  - python
title: Install the TerminusDB Python Client
nextjs:
  metadata:
    title: Install the TerminusDB Python Client
    description: A guide showing how to install the TerminusDB Client.
    keywords: terminusdb, getting started, install, install the terminusdb python client, python, setup, terminusdb python client
    openGraph:
      images: https://assets.terminusdb.com/docs/python-client-use-install-python-client.png
    alternates:
      canonical: https://terminusdb.org/docs/install-the-python-client/
media: []
---

{% callout type="note" %}
**Prerequisites**
- Python 3.8+ installed
- pip package manager available
{% /callout %}

{% callout type="note" %}
**What you'll achieve**
By the end of this guide, you will have the TerminusDB Python client installed and ready to use.
{% /callout %}

It is recommended that you install the TerminusDB Python client (which works with [Python >= 3.9](https://www.python.org/downloads)) in a [separate Python environment](https://docs.python.org/3/tutorial/venv.html). For example, if we use `venv` which comes with standard installation of Python 3.

First we create a new environment:

```bash
$ python3 -m venv ~/.virtualenvs/terminusdb
$ source ~/.virtualenvs/terminusdb/bin/activate
```

Then we can install using pip:

```bash
$ python3 -m pip install terminusdb
```