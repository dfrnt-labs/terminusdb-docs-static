---
title: Use the JSON View for building a Schema
slug: use-the-json-editor
seo:
  title: Use the JSON editor to build schema
  description: >-
    Use the JSON editor to build your TerminusCMS schema. Define documents,
    properties, links, and enums. 
  og_image: https://assets.terminusdb.com/docs/schema-as-code.png
media:
  - alt: Create a new product with the TerminusCMS or TerminusDB dashboard
    caption: ''
    media_type: Image
    title: Create a new product with the TerminusCMS or TerminusDB dashboard
    value: https://assets.terminusdb.com/docs/new-data-product.png
  - alt: TerminusCMS schema editor JSON view
    caption: ''
    media_type: Image
    title: TerminusCMS schema editor JSON view
    value: https://assets.terminusdb.com/docs/schema-as-code.png
---

## Make a New Data Product

First, log in to TerminusCMS, choose (or create) a team, and then click on "New Data Product".

![Create a new product with the TerminusCMS or TerminusDB dashboard](https://assets.terminusdb.com/docs/new-data-product.png)

## Create a schema as JSON

Now click on the pink bubbles on the left panel. This takes you to the schema builder page. Select JSON view from the tab and you'll see your entire schema as JSON.

![TerminusCMS schema editor JSON view](https://assets.terminusdb.com/docs/schema-as-code.png)

If you click on the Edit button in the upper right-hand corner, you'll be able to directly edit the schema.

If you have no data in your database, it should be possible to freely edit the schema. However, if you have data, then you may not be able to make arbitrary edits. The schema editor will warn you upon submission if some restrictions are violated.

Essentially it should _always_ be possible to [weaken](/docs/what-is-schema-weakening/) the schema safely through the interface. However, other changes will require [schema migration](/docs/schema-migration-reference-guide/).