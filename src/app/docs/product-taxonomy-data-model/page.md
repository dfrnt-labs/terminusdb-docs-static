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
    description: Build a product taxonomy data model step by step with curl and JSON. A category tree with UUID v7 keys, reads with and without children, products in one category, subtree and breadcrumb queries, and taxonomy changes on a branch.
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

We model a category as a document of its own. Each category holds a `Set` of its child categories in a `children` field. So the tree is stored from the top down.

Two annotations make this work well:

- **`@shared` on the `Category` class.** A [shared document](/docs/schema-reference-guide/#shared-reference-counted-documents) is a normal document with its own `@id`, so you can read and update each category on its own. TerminusDB also removes it when nothing links to it any more. When you take a category out of the tree and nothing else links to it, it is deleted at commit, and so are its children that nothing else links to.
- **`@unfold` on the `children` field.** When you read a category, TerminusDB [unfolds](/docs/document-unfolding-reference/) its children into the response, and their children too. So one read of the top category returns the whole taxonomy as one JSON document, with all attributes. One read of any other category returns that subtree.

The schema does not stop you from listing a category as a child of two parents. We keep the tree strict by convention: each category is in the `children` of at most one other category. When you move a category, you take it out of the old parent and add it to the new parent in the same request.

A product has one link, `category`, to the category it sits in. It is a required field, so each product must have exactly one category.

## Identity: UUID v7 keys

Each category uses a `UuidV7` key. The `@id` of a category is a GUID-style UUID, such as `Category/01a2220d-213d-705d-b24c-1dd5e0ef083d`. If you leave out `@id`, TerminusDB creates a new UUID v7 for you. UUID v7 values start with a timestamp, so new IDs sort by creation time. You can also send your own `@id`, for example a GUID from your PIM or ERP system. TerminusDB keeps it as it is (see [UuidV7 keys](/docs/schema-reference-guide/#uuidv7)).

On this page we send fixed IDs, so that you can copy the calls and get the same responses.

The `@id` does not depend on the name. You can rename *Footwear* to *Shoes* and the `@id` stays the same. Products keep their links. The `slug` is a normal field for URLs, and you can change it too.

## Build the taxonomy step by step

Every step is a curl call against a local TerminusDB on `http://localhost:6363` with the default user `admin:root`. Each step shows the JSON body and the response you should get.

The model looks like this:

| Type | Kind | Key | What it holds |
|------|------|-----|---------------|
| `Category` | shared document | `UuidV7` | slug, name, children (a set of categories, unfolded) |
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

`Category` holds a set of its own class for the children. `Product` links to `Category`:

{% http-example method="POST" path="/api/document/admin/taxonomy_model?graph_type=schema&author=admin&message=Add+taxonomy+schema" %}
[
  {"@type": "Class", "@id": "Category", "@shared": [],
   "@key": {"@type": "UuidV7"},
   "slug": "xsd:string", "name": "xsd:string",
   "children": {"@type": "Set", "@class": "Category", "@unfold": true}},
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

This is the tree we build. *All products* is the top category:

```text
All products
├── Clothing
│   ├── Tops
│   │   └── T-shirts
│   └── Footwear
│       └── Running shoes
└── Sports
    └── Fitness
        └── Yoga mats
```

You can send all categories in one request, and they can link to each other. Each category lists its children by `@id`:

{% http-example method="POST" path="/api/document/admin/taxonomy_model?author=admin&message=Add+category+tree" %}
[
  {"@type": "Category", "@id": "Category/01a2220d-2138-7486-97b4-6e440bbb184e",
   "slug": "all", "name": "All products",
   "children": ["Category/01a2220d-2139-77f8-bdcf-70a767d0de32", "Category/01a2220d-213e-7a96-bb59-2d680de34104"]},
  {"@type": "Category", "@id": "Category/01a2220d-2139-77f8-bdcf-70a767d0de32",
   "slug": "clothing", "name": "Clothing",
   "children": ["Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4", "Category/01a2220d-213c-7973-bdcb-5d151b295187"]},
  {"@type": "Category", "@id": "Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4",
   "slug": "clothing-tops", "name": "Tops",
   "children": ["Category/01a2220d-213b-71c0-9d01-3033944ecd5a"]},
  {"@type": "Category", "@id": "Category/01a2220d-213b-71c0-9d01-3033944ecd5a",
   "slug": "t-shirts", "name": "T-shirts"},
  {"@type": "Category", "@id": "Category/01a2220d-213c-7973-bdcb-5d151b295187",
   "slug": "footwear", "name": "Footwear",
   "children": ["Category/01a2220d-213d-705d-b24c-1dd5e0ef083d"]},
  {"@type": "Category", "@id": "Category/01a2220d-213d-705d-b24c-1dd5e0ef083d",
   "slug": "running-shoes", "name": "Running shoes"},
  {"@type": "Category", "@id": "Category/01a2220d-213e-7a96-bb59-2d680de34104",
   "slug": "sports", "name": "Sports",
   "children": ["Category/01a2220d-213f-720c-9b03-902c68236c15"]},
  {"@type": "Category", "@id": "Category/01a2220d-213f-720c-9b03-902c68236c15",
   "slug": "fitness", "name": "Fitness",
   "children": ["Category/01a2220d-2140-7fa0-a69e-9101b7b4b1c9"]},
  {"@type": "Category", "@id": "Category/01a2220d-2140-7fa0-a69e-9101b7b4b1c9",
   "slug": "yoga-mats", "name": "Yoga mats"}
]
{% http-expected %}
["Category/01a2220d-2138-7486-97b4-6e440bbb184e", "Category/01a2220d-2139-77f8-bdcf-70a767d0de32", "Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4", "Category/01a2220d-213b-71c0-9d01-3033944ecd5a", "Category/01a2220d-213c-7973-bdcb-5d151b295187", "Category/01a2220d-213d-705d-b24c-1dd5e0ef083d", "Category/01a2220d-213e-7a96-bb59-2d680de34104", "Category/01a2220d-213f-720c-9b03-902c68236c15", "Category/01a2220d-2140-7fa0-a69e-9101b7b4b1c9"]
{% /http-expected %}
{% /http-example %}

A category with no children, such as *T-shirts*, simply leaves out `children`.

### Step 4 — Insert products {% step %}

Each product links to the one category it sits in. We use the lowest category in the tree:

{% http-example method="POST" path="/api/document/admin/taxonomy_model?author=admin&message=Add+products" %}
[
  {"@type": "Product", "sku": "TS-001", "name": "Basic T-shirt", "price": 19.5,
   "category": "Category/01a2220d-213b-71c0-9d01-3033944ecd5a"},
  {"@type": "Product", "sku": "RS-100", "name": "Trail runner", "price": 129,
   "category": "Category/01a2220d-213d-705d-b24c-1dd5e0ef083d"},
  {"@type": "Product", "sku": "YM-200", "name": "Cork yoga mat", "price": 45,
   "category": "Category/01a2220d-2140-7fa0-a69e-9101b7b4b1c9"}
]
{% http-expected %}
["Product/TS-001", "Product/RS-100", "Product/YM-200"]
{% /http-expected %}
{% /http-example %}

## Read categories with and without children

Because `children` is unfolded, you choose how much of the tree you get back. The document interface returns the full subtree by default, and only the child IDs with `unfold=false`. In GraphQL, you get exactly the fields you ask for.

### Step 5 — Read the whole taxonomy in one call {% step %}

Read the top category. The response is the whole tree as one document:

{% http-example method="GET" path="/api/document/admin/taxonomy_model?id=Category/01a2220d-2138-7486-97b4-6e440bbb184e" /%}
{% http-expected %}
{"@id":"Category/01a2220d-2138-7486-97b4-6e440bbb184e","@type":"Category",
 "children":[
  {"@id":"Category/01a2220d-2139-77f8-bdcf-70a767d0de32","@type":"Category",
   "children":[
    {"@id":"Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4","@type":"Category",
     "children":[{"@id":"Category/01a2220d-213b-71c0-9d01-3033944ecd5a","@type":"Category","name":"T-shirts","slug":"t-shirts"}],
     "name":"Tops","slug":"clothing-tops"},
    {"@id":"Category/01a2220d-213c-7973-bdcb-5d151b295187","@type":"Category",
     "children":[{"@id":"Category/01a2220d-213d-705d-b24c-1dd5e0ef083d","@type":"Category","name":"Running shoes","slug":"running-shoes"}],
     "name":"Footwear","slug":"footwear"}],
   "name":"Clothing","slug":"clothing"},
  {"@id":"Category/01a2220d-213e-7a96-bb59-2d680de34104","@type":"Category",
   "children":[
    {"@id":"Category/01a2220d-213f-720c-9b03-902c68236c15","@type":"Category",
     "children":[{"@id":"Category/01a2220d-2140-7fa0-a69e-9101b7b4b1c9","@type":"Category","name":"Yoga mats","slug":"yoga-mats"}],
     "name":"Fitness","slug":"fitness"}],
   "name":"Sports","slug":"sports"}],
 "name":"All products","slug":"all"}
{% /http-expected %}

Read any other category in the same way to get its subtree. The order of the children in your response can be different.

### Step 6 — Read one category without its children {% step %}

Add `unfold=false` to get the category with only the `@id` of each child:

{% http-example method="GET" path="/api/document/admin/taxonomy_model?id=Category/01a2220d-2139-77f8-bdcf-70a767d0de32&unfold=false" /%}
{% http-expected %}
{"@id":"Category/01a2220d-2139-77f8-bdcf-70a767d0de32","@type":"Category","children":["Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4","Category/01a2220d-213c-7973-bdcb-5d151b295187"],"name":"Clothing","slug":"clothing"}
{% /http-expected %}

Use this when you only need one level, for example to edit one category. Each category is still its own document, so you change it on its own with a PUT.

### Step 7 — Read a category in GraphQL, without children {% step %}

GraphQL returns only the fields you name. Leave out `children` to get the category on its own:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Category(filter: {slug: {eq: \"footwear\"}}) { _id name slug } }"}
{% http-expected %}
{"data":{"Category":[{"_id":"Category/01a2220d-213c-7973-bdcb-5d151b295187","name":"Footwear","slug":"footwear"}]}}
{% /http-expected %}
{% /http-example %}

### Step 8 — Read a category in GraphQL, with children {% step %}

Name `children` and the fields you want inside it. Each level you nest goes one level deeper in the tree:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Category(filter: {slug: {eq: \"clothing\"}}) { name children { name children { name } } } }"}
{% http-expected %}
{"data":{"Category":[{"name":"Clothing","children":[{"name":"Tops","children":[{"name":"T-shirts"}]},{"name":"Footwear","children":[{"name":"Running shoes"}]}]}]}}
{% /http-expected %}
{% /http-example %}

In GraphQL you choose the depth in the query. To get every level below a category, whatever the depth, use a path query as in the next step.

## Query the tree

Two questions come up all the time for a taxonomy: "what is below this category?" and "where does this product sit?". You can answer both with a [path query](/docs/path-query-reference-guide/). In GraphQL, every class gets a `_path_to_CLASS` field (see [Path queries in GraphQL](/docs/path-queries-in-graphql/)).

In a path, a `<` in front of a field means "follow the link backwards". A `+` means "one or more times", and a `*` means "zero or more times". A `,` joins two steps.

### Step 9 — List all categories below Clothing {% step %}

The path `(children)+` walks down the tree, as deep as it goes:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Category(filter: {slug: {eq: \"clothing\"}}) { name _path_to_Category(path: \"(children)+\") { name } } }"}
{% http-expected %}
{"data":{"Category":[{"name":"Clothing","_path_to_Category":[{"name":"Tops"},{"name":"Footwear"},{"name":"T-shirts"},{"name":"Running shoes"}]}]}}
{% /http-expected %}
{% /http-example %}

The order of the names in your response can be different.

### Step 10 — Find all products under Clothing {% step %}

No product links to *Clothing* directly. The path first walks down the tree with `*`, so it also includes *Clothing* itself. Then it follows `category` backwards to the products:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Category(filter: {slug: {eq: \"clothing\"}}) { name _path_to_Product(path: \"(children)*,<category\") { sku name } } }"}
{% http-expected %}
{"data":{"Category":[{"name":"Clothing","_path_to_Product":[{"sku":"TS-001","name":"Basic T-shirt"},{"sku":"RS-100","name":"Trail runner"}]}]}}
{% /http-expected %}
{% /http-example %}

The yoga mat is not in the result, because *Sports* is a different branch of the tree. The order of the products can be different.

### Step 11 — Build a breadcrumb for a product {% step %}

Now go up the tree. The path starts at the product, follows `category` to its category, and then follows `children` backwards up to the top:

{% http-example method="POST" path="/api/graphql/admin/taxonomy_model" %}
{"query": "{ Product(filter: {sku: {eq: \"RS-100\"}}) { name _path_to_Category(path: \"category,(<children)*\") { name } } }"}
{% http-expected %}
{"data":{"Product":[{"name":"Trail runner","_path_to_Category":[{"name":"Running shoes"},{"name":"Footwear"},{"name":"Clothing"},{"name":"All products"}]}]}}
{% /http-expected %}
{% /http-example %}

Because each category has only one parent, there is exactly one way up. This gives one clear breadcrumb: *All products › Clothing › Footwear › Running shoes*. We think the response lists the categories from the product upwards, but please do not depend on the order. If the order matters, you can sort the result in your application, for example by the number of steps from the top. You can write the same queries in WOQL with the `path` keyword, see [Path queries in WOQL](/docs/path-queries-in-woql/).

## Change the taxonomy on a branch

Taxonomies change all the time: a category gets a new name, or a level in the tree goes away. Each change can move many products in the shop navigation, so it is good to make it on a branch, look at the diff, and only then bring it to main.

Here the merchandising team wants two changes: rename *Footwear* to *Shoes*, and move *T-shirts* directly under *Clothing*.

### Step 12 — Create a branch {% step %}

{% http-example method="POST" path="/api/branch/admin/taxonomy_model/local/branch/taxonomy-update" %}
{"origin": "admin/taxonomy_model/local/branch/main"}
{% http-expected %}
{"@type":"api:BranchResponse","api:status":"api:success"}
{% /http-expected %}
{% /http-example %}

### Step 13 — Rename and move categories on the branch {% step %}

A PUT replaces the whole document, so we send each changed category in full. To move *T-shirts*, we add it to the `children` of *Clothing* and take it out of *Tops*, in the same request:

{% http-example method="PUT" path="/api/document/admin/taxonomy_model/local/branch/taxonomy-update?author=admin&message=Rename+Footwear+and+flatten+Tops" %}
[
  {"@type": "Category", "@id": "Category/01a2220d-2139-77f8-bdcf-70a767d0de32",
   "slug": "clothing", "name": "Clothing",
   "children": ["Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4", "Category/01a2220d-213c-7973-bdcb-5d151b295187", "Category/01a2220d-213b-71c0-9d01-3033944ecd5a"]},
  {"@type": "Category", "@id": "Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4",
   "slug": "clothing-tops", "name": "Tops"},
  {"@type": "Category", "@id": "Category/01a2220d-213c-7973-bdcb-5d151b295187",
   "slug": "footwear", "name": "Shoes",
   "children": ["Category/01a2220d-213d-705d-b24c-1dd5e0ef083d"]}
]
{% http-expected %}
["Category/01a2220d-2139-77f8-bdcf-70a767d0de32", "Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4", "Category/01a2220d-213c-7973-bdcb-5d151b295187"]
{% /http-expected %}
{% /http-example %}

The `@id` of *Footwear* does not change, because it does not depend on the name. The products still link to the same categories. You did not touch them. Everything below a category moves with it.

Take care when you remove a category from `children`. A `@shared` category that nothing links to any more is deleted when you commit, and so are its children that nothing else links to. A product that links to a category keeps that category alive. Here *T-shirts* stays, because *Clothing* now links to it.

### Step 14 — See what changed {% step %}

Compare the branch with main. With `"unfold": false`, the diff shows child categories by `@id`, not in full:

{% http-example method="POST" path="/api/diff/admin/taxonomy_model" %}
{"before_data_version": "main", "after_data_version": "taxonomy-update", "unfold": false}
{% http-expected %}
[{"@id":"Category/01a2220d-2139-77f8-bdcf-70a767d0de32","children":{"@op":"CopyList","@rest":{"@after":["Category/01a2220d-213b-71c0-9d01-3033944ecd5a"],"@before":[],"@op":"SwapList","@rest":{"@op":"KeepList"}},"@to":1}},
 {"@id":"Category/01a2220d-213a-7fc8-b5ab-f7199d9087b4","children":{"@after":null,"@before":["Category/01a2220d-213b-71c0-9d01-3033944ecd5a"],"@op":"SwapValue"}},
 {"@id":"Category/01a2220d-213c-7973-bdcb-5d151b295187","name":{"@after":"Shoes","@before":"Footwear","@op":"SwapValue"}}]
{% /http-expected %}
{% /http-example %}

The diff shows what a reviewer needs to see: *T-shirts* is added to *Clothing* and taken out of *Tops*, and *Footwear* has a new name. When the team agrees, you can bring the change to main with a merge (see [Branch](/docs/branch/)). The empty *Tops* category is still there on the branch. To delete it, take it out of the `children` of *Clothing* in the same branch.

### Step 15 — Clean up {% step %}

This deletes the **taxonomy_model** database. Only run it when you are done:

{% http-example method="DELETE" path="/api/db/admin/taxonomy_model" confirm="This will permanently delete the taxonomy_model database." /%}
{% http-expected %}
{"@type":"api:DbDeleteResponse","api:status":"api:success"}
{% /http-expected %}

## Next step: traits and inheritance

The taxonomy on this page is data: categories are documents, and you change them like any other data. This is what makes a dynamic taxonomy possible. Teams can add, rename and move categories while the shop runs, without a schema change. With TerminusDB you can also review those changes in a pull request workflow: make them on a branch, look at the diff, and merge when the team agrees (see [Change request workflows](/docs/change-request-workflows/)). Both matter for a product taxonomy that many people work on. Want help with your own taxonomy? {% cta-link href="https://gettier.ai/connect" event="product_taxonomy_contact" %}Contact us{% /cta-link %} and tell us what you are building.

A strict tree is a good start. Real shops also need rules that cut across the tree: cheese and juice both spoil, wine and glasses both break. The next page shows how to model these as traits that the taxonomy classes inherit, and how to query them with WOQL:

- [Advanced product taxonomy](/docs/advanced-product-taxonomy/) — behavioral traits as abstract classes, inherited attributes, and a full taxonomy materialization with WOQL

## More reading

- [E-commerce Data Model](/docs/ecommerce-data-model/) — a starter schema for products, variants, brands, services and assortments
- [Explore an Ecommerce Dataset](/docs/explore-ecommerce-dataset/) — query, branch and diff a ready-made model with customers and orders
- [Taxonomy inheritance cookbook](/docs/cookbook-taxonomy-inheritance/) — let products inherit information, such as a data steward, from their place in the taxonomy
- [Path Query Reference Guide](/docs/path-query-reference-guide/) — the full path query syntax
- [Schema Reference Guide](/docs/schema-reference-guide/) — all key types and schema syntax
