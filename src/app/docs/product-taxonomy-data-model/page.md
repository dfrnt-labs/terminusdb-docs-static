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
    title: "Product Taxonomy Data Model: Category Trees, Breadcrumbs and Safe Changes"
    description: Build a product taxonomy data model step by step with curl and JSON. A simple category tree, products in one category, subtree and breadcrumb queries, and taxonomy changes on a branch.
    keywords: product taxonomy data model, product taxonomy, category hierarchy, product classification schema, taxonomy schema
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.com/docs/product-taxonomy-data-model/
media: []
---

A product taxonomy data model describes how a shop sorts its products: a tree of categories, and a link from each product to its category. TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. This page builds a small taxonomy with curl and JSON, queries it, and then changes it safely on a branch.

The page uses the same product domain as [Explore an Ecommerce Dataset](/docs/explore-ecommerce-dataset/) and the [E-commerce Data Model](/docs/ecommerce-data-model/). Here we only look at the taxonomy part, in more depth.

## What a product taxonomy needs

Most product taxonomies have the same few parts:

1. **A category tree.** Each category has one parent, for example *Clothing → Tops → T-shirts*. The tree gives the main navigation and the breadcrumbs.
2. **A stable identity.** Category names change. Links from products should not break when they do.
3. **One place for each product.** Each product sits in one category. You find it in the parent categories through the tree, so you do not copy it.
4. **Governance.** Many people want to change the taxonomy. You want to see and review a change before it goes live.

We keep the tree strict and simple: each category has at most one parent. A strict tree is easy to read, easy to check, and gives one clear breadcrumb for each product.

## Modelling the category tree

We model a category as a document of its own. It has a link to its parent, `parent_category`, which is `Optional`, because top-level categories have no parent. This is the same field name as in the [ecommerce dataset](/docs/explore-ecommerce-dataset/).

`Optional` holds zero or one value. So the schema itself makes sure that a category never has two parents.

A product has one link, `category`, to the category it sits in. It is a required field, so each product must have exactly one category.

## Identity: a slug as the key

Each category uses a `Lexical` key on a `slug` field, such as `running-shoes`. The `@id` of the category is made from the slug, so it becomes `Category/running-shoes`.

The display `name` is a normal field. You can rename *Footwear* to *Shoes* and the `@id` stays `Category/footwear`. Products keep their links. Try to keep slugs stable once products link to them. If you need a new slug, it is a new category.

## Build the taxonomy step by step

Every step is a curl call against a local TerminusDB on `http://localhost:6363` with the default user `admin:root`. Each step shows the JSON body and the response you should get.

The model looks like this:

| Type | Kind | Key | What it holds |
|------|------|-----|---------------|
| `Category` | document | Lexical on `slug` | slug, name, parent (optional) |
| `Product` | document | Lexical on `sku` | sku, name, price, category |

{% prerequisites-connected /%}

### Step 1 — Create a database {% step %}

{% http-example method="POST" path="/api/db/admin/taxonomy_model" %}
{"label": "Taxonomy model", "comment": "Product taxonomy data model tutorial"}
{% http-expected %}
{"@type":"api:DbCreateResponse","api:status":"api:success"}
{% /http-expected %}
{% /http-example %}

### Step 2 — Add the schema {% step %}

`Category` links to its own class for the parent. `Product` links to `Category`:

{% http-example method="POST" path="/api/document/admin/taxonomy_model?graph_type=schema&author=admin&message=Add+taxonomy+schema" %}
[
  {"@type": "Class", "@id": "Category",
   "@key": {"@type": "Lexical", "@fields": ["slug"]},
   "slug": "xsd:string", "name": "xsd:string",
   "parent_category": {"@type": "Optional", "@class": "Category"}},
  {"@type": "Class", "@id": "Product",
   "@key": {"@type": "Lexical", "@fields": ["sku"]},
   "sku": "xsd:string", "name": "xsd:string", "price": "xsd:decimal",
   "category": "Category"}
]
{% http-expected %}
["Category", "Product"]
{% /http-expected %}
{% /http-example %}

### Step 3 — Insert the categories {% step %}

This is the tree we build:

```text
Clothing
├── Tops
│   └── T-shirts
└── Footwear
    └── Running shoes
Sports
└── Fitness
    └── Yoga mats
```

You can send all categories in one request, and they can link to each other:

{% http-example method="POST" path="/api/document/admin/taxonomy_model?author=admin&message=Add+category+tree" %}
[
  {"@type": "Category", "slug": "clothing", "name": "Clothing"},
  {"@type": "Category", "slug": "clothing-tops", "name": "Tops",
   "parent_category": "Category/clothing"},
  {"@type": "Category", "slug": "t-shirts", "name": "T-shirts",
   "parent_category": "Category/clothing-tops"},
  {"@type": "Category", "slug": "footwear", "name": "Footwear",
   "parent_category": "Category/clothing"},
  {"@type": "Category", "slug": "running-shoes", "name": "Running shoes",
   "parent_category": "Category/footwear"},
  {"@type": "Category", "slug": "sports", "name": "Sports"},
  {"@type": "Category", "slug": "fitness", "name": "Fitness",
   "parent_category": "Category/sports"},
  {"@type": "Category", "slug": "yoga-mats", "name": "Yoga mats",
   "parent_category": "Category/fitness"}
]
{% http-expected %}
["Category/clothing", "Category/clothing-tops", "Category/t-shirts", "Category/footwear", "Category/running-shoes", "Category/sports", "Category/fitness", "Category/yoga-mats"]
{% /http-expected %}
{% /http-example %}

### Step 4 — Insert products {% step %}

Each product links to the one category it sits in. We use the lowest category in the tree:

{% http-example method="POST" path="/api/document/admin/taxonomy_model?author=admin&message=Add+products" %}
[
  {"@type": "Product", "sku": "TS-001", "name": "Basic T-shirt", "price": 19.5,
   "category": "Category/t-shirts"},
  {"@type": "Product", "sku": "RS-100", "name": "Trail runner", "price": 129,
   "category": "Category/running-shoes"},
  {"@type": "Product", "sku": "YM-200", "name": "Cork yoga mat", "price": 45,
   "category": "Category/yoga-mats"}
]
{% http-expected %}
["Product/TS-001", "Product/RS-100", "Product/YM-200"]
{% /http-expected %}
{% /http-example %}

### Step 5 — Read a category back {% step %}

{% http-example method="GET" path="/api/document/admin/taxonomy_model?id=Category/running-shoes" /%}
{% http-expected %}
{"@id":"Category/running-shoes","@type":"Category","name":"Running shoes","parent_category":"Category/footwear","slug":"running-shoes"}
{% /http-expected %}

The parent is a link to the `@id` of the parent category. The category does not store its children. You find them by following `parent_category` backwards, as in the next step.

## Query the tree

Two questions come up all the time for a taxonomy: "what is below this category?" and "where does this product sit?". You can answer both with a [path query](/docs/path-query-reference-guide/). In GraphQL, every class gets a `_path_to_CLASS` field (see [Path queries in GraphQL](/docs/path-queries-in-graphql/)).

In a path, a `<` in front of a field means "follow the link backwards". A `+` means "one or more times", and a `*` means "zero or more times". A `,` joins two steps.

### Step 6 — List all categories below Clothing {% step %}

The path `(<parent_category)+` walks down the tree, as deep as it goes:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Category(filter: {slug: {eq: \"clothing\"}}) { name _path_to_Category(path: \"(<parent_category)+\") { name } } }"}
{% http-expected %}
{"data":{"Category":[{"name":"Clothing","_path_to_Category":[{"name":"Tops"},{"name":"T-shirts"},{"name":"Footwear"},{"name":"Running shoes"}]}]}}
{% /http-expected %}
{% /http-example %}

The order of the names in your response can be different.

### Step 7 — Find all products under Clothing {% step %}

No product links to *Clothing* directly. The path first walks down the tree with `*`, so it also includes *Clothing* itself. Then it follows `category` backwards to the products:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Category(filter: {slug: {eq: \"clothing\"}}) { name _path_to_Product(path: \"(<parent_category)*,<category\") { sku name } } }"}
{% http-expected %}
{"data":{"Category":[{"name":"Clothing","_path_to_Product":[{"sku":"TS-001","name":"Basic T-shirt"},{"sku":"RS-100","name":"Trail runner"}]}]}}
{% /http-expected %}
{% /http-example %}

The yoga mat is not in the result, because *Sports* is a different branch of the tree. The order of the products can be different.

### Step 8 — Build a breadcrumb for a product {% step %}

Now go up the tree. The path starts at the product, follows `category` to its category, and then follows `parent_category` up to the top:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Product(filter: {sku: {eq: \"RS-100\"}}) { name _path_to_Category(path: \"category,(parent_category)*\") { name } } }"}
{% http-expected %}
{"data":{"Product":[{"name":"Trail runner","_path_to_Category":[{"name":"Running shoes"},{"name":"Footwear"},{"name":"Clothing"}]}]}}
{% /http-expected %}
{% /http-example %}

Because each category has only one parent, there is exactly one way up. This gives one clear breadcrumb: *Clothing › Footwear › Running shoes*. We think the response lists the categories from the product upwards, but please do not depend on the order. If the order matters, you can sort the result in your application, for example by the number of steps from the top. You can write the same queries in WOQL with the `path` keyword, see [Path queries in WOQL](/docs/path-queries-in-woql/).

## Change the taxonomy on a branch

Taxonomies change all the time: a category gets a new name, or a level in the tree goes away. Each change can move many products in the shop navigation, so it is good to make it on a branch, look at the diff, and only then bring it to main.

Here the merchandising team wants two changes: rename *Footwear* to *Shoes*, and move *T-shirts* directly under *Clothing*.

### Step 9 — Create a branch {% step %}

{% http-example method="POST" path="/api/branch/admin/taxonomy_model/local/branch/taxonomy-update" %}
{"origin": "admin/taxonomy_model/local/branch/main"}
{% http-expected %}
{"@type":"api:BranchResponse","api:status":"api:success"}
{% /http-expected %}
{% /http-example %}

### Step 10 — Rename and move categories on the branch {% step %}

A PUT replaces the whole document, so we send each category in full:

{% http-example method="PUT" path="/api/document/admin/taxonomy_model/local/branch/taxonomy-update?author=admin&message=Rename+Footwear+and+flatten+Tops" %}
[
  {"@id": "Category/footwear", "@type": "Category", "slug": "footwear", "name": "Shoes",
   "parent_category": "Category/clothing"},
  {"@id": "Category/t-shirts", "@type": "Category", "slug": "t-shirts", "name": "T-shirts",
   "parent_category": "Category/clothing"}
]
{% http-expected %}
["Category/footwear", "Category/t-shirts"]
{% /http-expected %}
{% /http-example %}

The `@id` of *Footwear* does not change, because it comes from the slug. The products still link to the same categories. You did not touch them.

To move a category, you only change its one `parent_category` link. Everything below it moves with it.

### Step 11 — See what changed {% step %}

Compare the branch with main:

{% http-example method="POST" path="/api/diff/admin/taxonomy_model" %}
{"before_data_version": "main", "after_data_version": "taxonomy-update"}
{% http-expected %}
[{"@id": "Category/footwear", "name": {"@op": "SwapValue", "@before": "Footwear", "@after": "Shoes"}}, {"@id": "Category/t-shirts", "parent_category": {"@op": "SwapValue", "@before": "Category/clothing-tops", "@after": "Category/clothing"}}]
{% /http-expected %}
{% /http-example %}

The diff shows one field per category: the new name, and the new parent. This is the change a reviewer needs to see. When the team agrees, you can bring the change to main with a merge (see [Branch](/docs/branch/)). The empty *Tops* category is still there on the branch, so you can delete it in the same branch if you no longer need it.

### Step 12 — Clean up {% step %}

This deletes the **taxonomy_model** database. Only run it when you are done:

{% http-example method="DELETE" path="/api/db/admin/taxonomy_model" confirm="This will permanently delete the taxonomy_model database." /%}
{% http-expected %}
{"@type":"api:DbDeleteResponse","api:status":"api:success"}
{% /http-expected %}

## Next step: traits and inheritance

A strict tree is a good start. Real shops also need rules that cut across the tree: cheese and juice both spoil, wine and glasses both break. The next page shows how to model these as traits that the taxonomy classes inherit, and how to query them with WOQL:

- [Advanced product taxonomy](/docs/advanced-product-taxonomy/) — behavioral traits as abstract classes, inherited attributes, and a full taxonomy materialization with WOQL

## More reading

- [E-commerce Data Model](/docs/ecommerce-data-model/) — a starter schema for products, variants, brands, services and assortments
- [Explore an Ecommerce Dataset](/docs/explore-ecommerce-dataset/) — query, branch and diff a ready-made model with customers and orders
- [Taxonomy inheritance cookbook](/docs/cookbook-taxonomy-inheritance/) — let products inherit information, such as a data steward, from their place in the taxonomy
- [Path Query Reference Guide](/docs/path-query-reference-guide/) — the full path query syntax
- [Schema Reference Guide](/docs/schema-reference-guide/) — all key types and schema syntax
