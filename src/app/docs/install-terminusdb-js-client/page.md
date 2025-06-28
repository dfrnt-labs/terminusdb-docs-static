---
title: Install the TerminusDB JavaScript Client
nextjs:
  metadata:
    title: Install the TerminusDB JavaScript Client
    description: Installation instruction for the TerminusDB JavaScript Client
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/install-terminusdb-js-client/
media: []
---

## Requirements

Node.js version 10+ if using the TerminusDB client library as a Node.js package

## Installation

The TerminusDB JavaScript client library can be used either as a Node.js package or as a script that runs in the browser.

### NPM Package

> If you don't already have Node.js installed, install it first. [node-install](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

To install the `terminusdb-client` package as a dependency in an existing package, run:

```bash
npm install --save @terminusdb/terminusdb-client
```

This command updates your `package.json`.

### Script

To use the `terminusdb-client` script on a webpage sourced from a CDN, add this to your HTML:

```html
<script src="https://unpkg.com/@terminusdb/terminusdb-client/dist/terminusdb-client.min.js"></script>
```

Alternatively, you can download the latest [`terminusdb-client.min.js`](https://unpkg.com/@terminusdb/terminusdb-client/dist/terminusdb-client.min.js), add it to your sources, and use that in the `<script>` instead.