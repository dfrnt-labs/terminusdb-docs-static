---
tags:
  - schema
  - tutorial
  - curl
  - graphql
  - beginner
title: Product Taxonomy Data Model
nextjs:
  metadata:
    title: "Product Taxonomy Data Model: Category Trees, Facets and Safe Changes"
    description: Build a product taxonomy data model step by step with curl and JSON. Category trees, categories with more than one parent, attributes per category, subtree queries, and taxonomy changes on a branch.
    keywords: product taxonomy data model, product taxonomy, category hierarchy, product classification schema, taxonomy schema
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.com/docs/product-taxonomy-data-model/
media: []
---

A product taxonomy data model describes how a shop sorts its products: a tree of categories, the attributes each category needs, and the links from products to categories. TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. This page builds a small taxonomy with curl and JSON, and then changes it safely on a branch.

The page uses the same product domain as [Explore an Ecommerce Dataset](/docs/explore-ecommerce-dataset/) and the [E-commerce Data Model](/docs/ecommerce-data-model/). Here we only look at the taxonomy part, in more depth.

## What a product taxonomy needs

Most product taxonomies have the same few parts:

1. **A category tree.** Each category has one main parent, for example *Clothing → Tops → T-shirts*. The tree gives the main navigation and the breadcrumbs.
2. **Extra parents.** Some categories belong in more than one place. *Running shoes* sits under *Footwear*, but shoppers also look for it under *Sports*. This is often called a polyhierarchy.
3. **A stable identity.** Category names change. Links from products should not break when they do.
4. **Attributes per category.** A T-shirt has a size and a fabric. A running shoe has a shoe size and a terrain. The category says which attributes its products have. These are often called facets, because shoppers filter on them.
5. **Governance.** Many people want to change the taxonomy. You want to see and review a change before it goes live.

## Modelling the category tree

We model a category as a document of its own. It has a link to its main parent, `parent_category`, which is `Optional`, because top-level categories have no parent. This is the same field name as in the [ecommerce dataset](/docs/explore-ecommerce-dataset/).

For extra parents, the category has a second field, `also_under`. It is a `Set` of categories, so it can hold zero, one or many links. We keep the main parent and the extra parents apart on purpose: the main parent gives one clear breadcrumb, and the extra parents only add more ways to find the category.

## Identity: a slug as the key

Each category uses a `Lexical` key on a `slug` field, such as `running-shoes`. The `@id` of the category is made from the slug, so it becomes `Category/running-shoes`.

The display `name` is a normal field. You can rename *Footwear* to *Shoes* and the `@id` stays `Category/footwear`. Products keep their links. Try to keep slugs stable once products link to them. If you need a new slug, it is a new category.

## Attributes per category

Each category has a `Set` of `Attribute` subdocuments. An attribute has a name, a value type and, for choices, a set of allowed values. The value type is an `Enum` with three values: `text`, `number` and `choice`.

A product stores its values as a `Set` of `AttributeValue` subdocuments, each with a name and a value.

The schema checks the shape of each attribute and each value. It does not check that a product only uses the attributes of its categories, or that a `choice` value is one of the allowed values. Your application or an import script does that check. If an attribute is the same for the whole shop, and you filter on it all the time, it may be better as a typed field on `Product`, or as its own `Enum`.

## Build the taxonomy step by step

Every step is a curl call against a local TerminusDB on `http://localhost:6363` with the default user `admin:root`. Each step shows the JSON body and the response you should get.

The model looks like this:

| Type | Kind | Key | What it holds |
|------|------|-----|---------------|
| `AttributeType` | enum | — | text, number, choice |
| `Attribute` | subdocument of `Category` | Lexical on `name` | name, value type, allowed values |
| `Category` | document | Lexical on `slug` | slug, name, main parent, extra parents, attributes |
| `AttributeValue` | subdocument of `Product` | Lexical on `name` | name, value |
| `Product` | document | Lexical on `sku` | sku, name, price, categories, attribute values |

{% prerequisites-connected /%}

### Step 1 — Create a database {% step %}

{% http-example method="POST" path="/api/db/admin/taxonomy_model" %}
{"label": "Taxonomy model", "comment": "Product taxonomy data model tutorial"}
{% http-expected %}
{"@type":"api:DbCreateResponse","api:status":"api:success"}
{% /http-expected %}
{% /http-example %}

### Step 2 — Add the attribute definitions {% step %}

`Attribute` is a subdocument: an attribute definition only makes sense inside its category.

{% http-example method="POST" path="/api/document/admin/taxonomy_model?graph_type=schema&author=admin&message=Add+attribute+definitions" %}
[
  {"@type": "Enum", "@id": "AttributeType", "@value": ["text", "number", "choice"]},
  {"@type": "Class", "@id": "Attribute", "@subdocument": [],
   "@key": {"@type": "Lexical", "@fields": ["name"]},
   "name": "xsd:string", "value_type": "AttributeType",
   "allowed_values": {"@type": "Set", "@class": "xsd:string"}}
]
{% http-expected %}
["AttributeType", "Attribute"]
{% /http-expected %}
{% /http-example %}

### Step 3 — Add Category {% step %}

A category links to its main parent and to any extra parents. Both links point to the `Category` class itself.

{% http-example method="POST" path="/api/document/admin/taxonomy_model?graph_type=schema&author=admin&message=Add+Category" %}
{"@type": "Class", "@id": "Category",
 "@key": {"@type": "Lexical", "@fields": ["slug"]},
 "slug": "xsd:string", "name": "xsd:string",
 "parent_category": {"@type": "Optional", "@class": "Category"},
 "also_under": {"@type": "Set", "@class": "Category"},
 "attributes": {"@type": "Set", "@class": "Attribute"}}
{% http-expected %}
["Category"]
{% /http-expected %}
{% /http-example %}

### Step 4 — Add AttributeValue and Product {% step %}

A product can be in more than one category, so `categories` is a `Set`.

{% http-example method="POST" path="/api/document/admin/taxonomy_model?graph_type=schema&author=admin&message=Add+Product" %}
[
  {"@type": "Class", "@id": "AttributeValue", "@subdocument": [],
   "@key": {"@type": "Lexical", "@fields": ["name"]},
   "name": "xsd:string", "value": "xsd:string"},
  {"@type": "Class", "@id": "Product",
   "@key": {"@type": "Lexical", "@fields": ["sku"]},
   "sku": "xsd:string", "name": "xsd:string", "price": "xsd:decimal",
   "categories": {"@type": "Set", "@class": "Category"},
   "attributes": {"@type": "Set", "@class": "AttributeValue"}}
]
{% http-expected %}
["AttributeValue", "Product"]
{% /http-expected %}
{% /http-example %}

### Step 5 — Insert the categories {% step %}

This is the tree we build. *Running shoes* has *Footwear* as its main parent and *Sports* as an extra parent:

```text
Clothing
├── Tops
│   └── T-shirts          (attributes: size, fabric)
└── Footwear
    └── Running shoes     (attributes: shoe_size, terrain; also under Sports)
Sports
```

You can send all categories in one request, and they can link to each other:

{% http-example method="POST" path="/api/document/admin/taxonomy_model?author=admin&message=Add+category+tree" %}
[
  {"@type": "Category", "slug": "clothing", "name": "Clothing"},
  {"@type": "Category", "slug": "sports", "name": "Sports"},
  {"@type": "Category", "slug": "clothing-tops", "name": "Tops",
   "parent_category": "Category/clothing"},
  {"@type": "Category", "slug": "t-shirts", "name": "T-shirts",
   "parent_category": "Category/clothing-tops",
   "attributes": [
     {"@type": "Attribute", "name": "size", "value_type": "choice",
      "allowed_values": ["S", "M", "L"]},
     {"@type": "Attribute", "name": "fabric", "value_type": "text"}
   ]},
  {"@type": "Category", "slug": "footwear", "name": "Footwear",
   "parent_category": "Category/clothing"},
  {"@type": "Category", "slug": "running-shoes", "name": "Running shoes",
   "parent_category": "Category/footwear",
   "also_under": ["Category/sports"],
   "attributes": [
     {"@type": "Attribute", "name": "shoe_size", "value_type": "number"},
     {"@type": "Attribute", "name": "terrain", "value_type": "choice",
      "allowed_values": ["road", "trail"]}
   ]}
]
{% http-expected %}
["Category/clothing", "Category/sports", "Category/clothing-tops", "Category/t-shirts", "Category/footwear", "Category/running-shoes"]
{% /http-expected %}
{% /http-example %}

### Step 6 — Insert products {% step %}

Each product links to its categories and stores the values for the attributes of those categories:

{% http-example method="POST" path="/api/document/admin/taxonomy_model?author=admin&message=Add+products" %}
[
  {"@type": "Product", "sku": "TS-001", "name": "Basic T-shirt", "price": 19.5,
   "categories": ["Category/t-shirts"],
   "attributes": [
     {"@type": "AttributeValue", "name": "size", "value": "M"},
     {"@type": "AttributeValue", "name": "fabric", "value": "organic cotton"}
   ]},
  {"@type": "Product", "sku": "RS-100", "name": "Trail runner", "price": 129,
   "categories": ["Category/running-shoes"],
   "attributes": [
     {"@type": "AttributeValue", "name": "shoe_size", "value": "42"},
     {"@type": "AttributeValue", "name": "terrain", "value": "trail"}
   ]}
]
{% http-expected %}
["Product/TS-001", "Product/RS-100"]
{% /http-expected %}
{% /http-example %}

We store every value as a string to keep the model small. If you need typed values, you can give `AttributeValue` one optional field per type, for example `number_value` with the type `xsd:decimal`.

### Step 7 — Read a category back {% step %}

{% http-example method="GET" path="/api/document/admin/taxonomy_model?id=Category/running-shoes" /%}
{% http-expected %}
{"@id":"Category/running-shoes","@type":"Category","also_under":["Category/sports"],"attributes":[{"@id":"Category/running-shoes/attributes/Attribute/shoe_size","@type":"Attribute","name":"shoe_size","value_type":"number"},{"@id":"Category/running-shoes/attributes/Attribute/terrain","@type":"Attribute","allowed_values":["road","trail"],"name":"terrain","value_type":"choice"}],"name":"Running shoes","parent_category":"Category/footwear","slug":"running-shoes"}
{% /http-expected %}

The attribute definitions come back inside the category, and their `@id` starts with the category's `@id`. The parents are links. A `Set` has no order, so the attributes can come back in a different order on your machine.

## Query a subtree

A common question for a taxonomy is "what is below this category?". You can answer it with a [path query](/docs/path-query-reference-guide/). In GraphQL, every class gets a `_path_to_CLASS` field (see [Path queries in GraphQL](/docs/path-queries-in-graphql/)). A `<` in front of a field means "follow the link backwards", and `+` means "one or more times".

### Step 8 — List all categories below Clothing {% step %}

The path `(<parent_category|<also_under)+` follows main parents and extra parents backwards, as deep as the tree goes:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Category(filter: {slug: {eq: \"clothing\"}}) { name _path_to_Category(path: \"(<parent_category|<also_under)+\") { name } } }"}
{% http-expected %}
{"data":{"Category":[{"name":"Clothing","_path_to_Category":[{"name":"Tops"},{"name":"T-shirts"},{"name":"Footwear"},{"name":"Running shoes"}]}]}}
{% /http-expected %}
{% /http-example %}

The order of the names in your response can be different.

### Step 9 — Find all products under Sports {% step %}

No product links to *Sports* directly. The path first walks down the tree (`*` means zero or more times), and then follows `categories` backwards to the products:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Category(filter: {slug: {eq: \"sports\"}}) { name _path_to_Product(path: \"(<parent_category|<also_under)*,<categories\") { sku name } } }"}
{% http-expected %}
{"data":{"Category":[{"name":"Sports","_path_to_Product":[{"sku":"RS-100","name":"Trail runner"}]}]}}
{% /http-expected %}
{% /http-example %}

The trail runner shows up through the extra parent of *Running shoes*. You did not copy the product into a second category. You can write the same queries in WOQL with the `path` keyword, see [Path queries in WOQL](/docs/path-queries-in-woql/).

## Change the taxonomy on a branch

Taxonomies change all the time: a category gets a new name, or a level in the tree goes away. Each change can move many products in the shop navigation, so it is good to make it on a branch, look at the diff, and only then bring it to main.

Here the merchandising team wants two changes: rename *Footwear* to *Shoes*, and move *T-shirts* directly under *Clothing*.

### Step 10 — Create a branch {% step %}

{% http-example method="POST" path="/api/branch/admin/taxonomy_model/local/branch/taxonomy-update" %}
{"origin": "admin/taxonomy_model/local/branch/main"}
{% http-expected %}
{"@type":"api:BranchResponse","api:status":"api:success"}
{% /http-expected %}
{% /http-example %}

### Step 11 — Rename and move categories on the branch {% step %}

A PUT replaces the whole document, so we send each category in full, with its attributes:

{% http-example method="PUT" path="/api/document/admin/taxonomy_model/local/branch/taxonomy-update?author=admin&message=Rename+Footwear+and+flatten+Tops" %}
[
  {"@id": "Category/footwear", "@type": "Category", "slug": "footwear", "name": "Shoes",
   "parent_category": "Category/clothing"},
  {"@id": "Category/t-shirts", "@type": "Category", "slug": "t-shirts", "name": "T-shirts",
   "parent_category": "Category/clothing",
   "attributes": [
     {"@type": "Attribute", "name": "size", "value_type": "choice",
      "allowed_values": ["S", "M", "L"]},
     {"@type": "Attribute", "name": "fabric", "value_type": "text"}
   ]}
]
{% http-expected %}
["Category/footwear", "Category/t-shirts"]
{% /http-expected %}
{% /http-example %}

The `@id` of *Footwear* does not change, because it comes from the slug. The products still link to the same categories. You did not touch them.

### Step 12 — See what changed {% step %}

Compare the branch with main:

{% http-example method="POST" path="/api/diff/admin/taxonomy_model" %}
{"before_data_version": "main", "after_data_version": "taxonomy-update"}
{% http-expected %}
[{"@id": "Category/footwear", "name": {"@op": "SwapValue", "@before": "Footwear", "@after": "Shoes"}}, {"@id": "Category/t-shirts", "parent_category": {"@op": "SwapValue", "@before": "Category/clothing-tops", "@after": "Category/clothing"}}]
{% /http-expected %}
{% /http-example %}

The diff shows one field per category: the new name, and the new main parent. This is the change a reviewer needs to see. When the team agrees, you can bring the change to main with a merge (see [Branch](/docs/branch/)). The empty *Tops* category is still there on the branch, so you can delete it in the same branch if you no longer need it.

### Step 13 — Clean up {% step %}

This deletes the **taxonomy_model** database. Only run it when you are done:

{% http-example method="DELETE" path="/api/db/admin/taxonomy_model" confirm="This will permanently delete the taxonomy_model database." /%}
{% http-expected %}
{"@type":"api:DbDeleteResponse","api:status":"api:success"}
{% /http-expected %}

## Next steps

- [E-commerce Data Model](/docs/ecommerce-data-model/) — a starter schema for products, variants, brands, services and assortments
- [Explore an Ecommerce Dataset](/docs/explore-ecommerce-dataset/) — query, branch and diff a ready-made model with customers and orders
- [Taxonomy inheritance cookbook](/docs/cookbook-taxonomy-inheritance/) — let products inherit information, such as a data steward, from their place in the taxonomy
- [Path Query Reference Guide](/docs/path-query-reference-guide/) — the full path query syntax
- [Schema Reference Guide](/docs/schema-reference-guide/) — all key types and schema syntax
- [How to Model Schema](/docs/model-schema/) — more how-to guides for schema modelling
