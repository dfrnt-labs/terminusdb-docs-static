---
tags:
  - schema
  - tutorial
  - curl
  - beginner
title: E-commerce Data Model
nextjs:
  metadata:
    title: "E-commerce Data Model: A Starter Schema for Products, Categories and Services"
    description: A starter ecommerce data model for products, variants, categories, brands, services and assortments. Build it step by step with curl and JSON, then change it safely on a branch.
    keywords: ecommerce data model, product data model, data modeling best practices, product catalog schema, ecommerce schema
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.com/docs/ecommerce-data-model/
media: []
---

A good ecommerce data model is mostly a set of small decisions. What is a thing of its own? What belongs inside something else? What do many things share? This page goes through those decisions one at a time. Then it builds a starter model for products, variants, categories, brands, services and assortments.

You can read the page from top to bottom, or jump to [the starter model](#a-starter-model-for-e-commerce) and follow along with curl. We think the questions matter more than the exact schema, so please change the model to fit your shop.

## Start with the questions, not the tables

Before you write any schema, try to answer four questions on paper:

1. **What are the things?** Write down the nouns people use: product, variant, category, brand, service, assortment, order. Each noun is a candidate for a document type.
2. **How do they relate?** A product has variants. A product is in categories. Many products share one brand. An assortment lists products for one market.
3. **What changes often?** Prices and stock change every day. A brand's return policy changes maybe once a year. Things that change at a different pace often want to live in different documents.
4. **Who edits what?** The catalog team edits products. The brand team edits brand pages. Merchandisers edit assortments. If two teams edit it, it probably should not be one document.

It is fine if the answers are rough. You can change the model later (see [Evolve the model safely](#evolve-the-model-safely)).

## How much goes in one document?

A document is a unit you read, write and link to as one thing. A subdocument lives inside a document and has no life of its own. Some simple rules help:

- **Make it a document** when it has its own identity (a SKU, a code, a name people search for), its own lifecycle, or is edited by different people. Products, categories, brands and assortments are documents.
- **Make it a subdocument** when it only makes sense inside its parent, and you always read and write it together with the parent. A price (amount + currency) and a product variant (size, colour, SKU) are subdocuments of the product.
- **Keep documents small enough to edit safely.** If one document holds a whole catalog, every small change rewrites a big document, and two people who edit it get in each other's way.

The [Documents explanation](/docs/documents-explanation/) goes deeper on documents and subdocuments.

## Shared documents

Some data is the same for many products. A brand is a good example: its name, website and return policy are the same for every product it makes. A shared spec sheet, a size chart or a supplier are other examples.

Do not copy that data into every product. Make it **one document** and **link** to it from each product. Each product only stores a reference, such as `"brand": "Brand/Northwind"`. When the return policy changes, you edit the brand document once, and every product that links to it sees the new policy. There are no copies to keep in sync.

Documents are linked by reference, not copied. This is one of the main reasons to model shared data as its own document. You will try it in Step 8 of the starter model below.

If a shared document should be deleted automatically when nothing links to it any more, have a look at `@shared` in the [Schema Reference Guide](/docs/schema-reference-guide/). The starter model does not need it: a brand should stay even if it has no products for a while.

## Grouping things: subdocuments, sets and lists

Sometimes you want a "box" that groups some fields. You do not need an extra document type for that. Use these instead:

- **`@subdocument`** for a group of fields that belongs to one parent, such as `Money` (amount + currency).
- **`Set`** for many values where order does not matter, such as the categories of a product or its variants.
- **`List`** for many values where order matters, such as images in a fixed order.
- **`Optional`** for a field that may be missing, such as a product description or the end date of an assortment.

The [Schema Reference Guide](/docs/schema-reference-guide/) describes `Set`, `List`, `Array` and `Optional` in full.

## Fixed choices: enums and tagged unions

When a field can only have a few fixed values, use an `Enum`. A product status is a good fit:

```json
{"@type": "Enum", "@id": "Status", "@value": ["draft", "active", "discontinued"]}
```

When a field can have **one of several shapes**, use a `TaggedUnion`. For example, a delivery can be a shipping address or a download link, but never both. A `TaggedUnion` has one field per choice, and a document sets exactly one of them. The starter model uses one for the payment method of an order. You can try it in [Steps 9 to 11](#one-payment-method-per-order-a-tagged-union). The [Schema Reference Guide](/docs/schema-reference-guide/) has the full syntax.

## Identity: picking a key

The `@key` decides how a document gets its `@id`. There are a few strategies:

- **`Lexical`** builds the `@id` from fields you choose. A product with key field `sku` and SKU `TS-001` gets the `@id` `Product/TS-001`. Use it when the business already has a stable code, like a SKU.
- **`Random`** makes a new random `@id`. Use it when nothing in the data is a natural key.
- **`UuidV7`** makes the `@id` a UUID version 7, also called a GUID. Use it when you want GUID-style IDs, or when IDs come from other systems. If you leave out the `@id`, TerminusDB creates one like `Product/01a120f0-47a7-7f20-9295-b3034d7fc5d3`. If you send an `@id`, it is used as it is. A UUID v7 starts with a timestamp, so new IDs sort by creation time, and that suits TerminusDB's compact front-coded storage. See [UuidV7](/docs/schema-reference-guide/#uuid-v7) in the Schema Reference Guide.
- **`Hash`** and **`ValueHash`** build the `@id` from a hash of some fields or of the whole value. Two documents with the same content get the same `@id`.

To use a GUID key, set it on the class:

```json
{"@type": "Class", "@id": "Product", "@key": {"@type": "UuidV7"}, "name": "xsd:string"}
```

For subdocuments, we suggest you **prefer Lexical or Random keys for now**. The starter model uses `Lexical` keys everywhere, so the IDs in the examples are easy to read and the same on your machine. The [Schema Reference Guide](/docs/schema-reference-guide/) has the full list of key types.

## A starter model for e-commerce

Now let's build the model. Every step is a curl call against a local TerminusDB on `http://localhost:6363` with the default user `admin:root`. Each step shows the JSON body and the response you should get.

The model looks like this:

| Type | Kind | Key | What it holds |
|------|------|-----|---------------|
| `Money` | subdocument | Lexical on `currency` | amount, currency |
| `Status` | enum | — | draft, active, discontinued |
| `Category` | document | Lexical on `name` | name, optional parent (a category tree) |
| `Brand` | shared document, linked by many products | Lexical on `name` | name, website, return policy |
| `Variant` | subdocument | Lexical on `sku` | sku, size, colour |
| `Sellable` | abstract class | — | name, price, status |
| `Product` | document, inherits `Sellable` | Lexical on `sku` | sku, brand, categories, variants, optional metadata |
| `Service` | document, inherits `Sellable` | Lexical on `code` | code, duration, booking required |
| `Assortment` | document | Lexical on `name` | name, market, dates, products |
| `PaymentMethod` | tagged union, subdocument | Random | exactly one of: card, invoice, gift card, cash on delivery |
| `Order` | document | Lexical on `order_number` | order number, products, total, payment |

We add `Order` and `PaymentMethod` later, in [Step 9](#one-payment-method-per-order-a-tagged-union). Customers are not part of this model, and the orders are kept small. The [ecommerce dataset tutorial](/docs/explore-ecommerce-dataset/) has a ready-made model with customers and fuller orders.

{% prerequisites-connected /%}

### Step 1 — Create a database {% step %}

{% http-example method="POST" path="/api/db/admin/shop_model" %}
{"label": "Shop model", "comment": "E-commerce data model tutorial"}
{% http-expected %}
{"@type":"api:DbCreateResponse","api:status":"api:success"}
{% /http-expected %}
{% /http-example %}

### Step 2 — Add Money and Status {% step %}

`Money` is a subdocument: a price only makes sense inside the thing it prices. `Status` is an enum with three fixed values.

{% http-example method="POST" path="/api/document/admin/shop_model?graph_type=schema&author=admin&message=Add+Money+and+Status" %}
[
  {"@type": "Class", "@id": "Money", "@subdocument": [],
   "@key": {"@type": "Lexical", "@fields": ["currency"]},
   "amount": "xsd:decimal", "currency": "xsd:string"},
  {"@type": "Enum", "@id": "Status", "@value": ["draft", "active", "discontinued"]}
]
{% http-expected %}
["Money", "Status"]
{% /http-expected %}
{% /http-example %}

We use `xsd:decimal` for the amount, so prices stay exact and you do not get floating point rounding. It is a standards-based type from XML Schema with well-known semantics, and it supports at least 20 digits of precision. See [XSD data types](/docs/xsd-data-types/) for details.

### Step 3 — Add Category and Brand {% step %}

A `Category` can have a parent category, so categories make a tree. A `Brand` is a document of its own, because many products share it.

{% http-example method="POST" path="/api/document/admin/shop_model?graph_type=schema&author=admin&message=Add+Category+and+Brand" %}
[
  {"@type": "Class", "@id": "Category",
   "@key": {"@type": "Lexical", "@fields": ["name"]},
   "name": "xsd:string",
   "parent": {"@type": "Optional", "@class": "Category"}},
  {"@type": "Class", "@id": "Brand",
   "@key": {"@type": "Lexical", "@fields": ["name"]},
   "name": "xsd:string", "website": "xsd:string", "return_policy": "xsd:string"}
]
{% http-expected %}
["Category", "Brand"]
{% /http-expected %}
{% /http-example %}

### Step 4 — Add Variant, Sellable, Product and Service {% step %}

`Sellable` is abstract. It has no documents of its own, but it holds the fields that products and services share. `Product` and `Service` inherit from it with `@inherits`. Inheritance does not copy the key strategy, so `Product` and `Service` each set their own `@key`.

`Product` links to one `Brand` and to a `Set` of categories, and it has a `Set` of `Variant` subdocuments. The optional `metadata` field has the type `sys:JSON`, so it can hold any JSON (more on this [below](#extra-data-without-a-schema-change)).

{% http-example method="POST" path="/api/document/admin/shop_model?graph_type=schema&author=admin&message=Add+products+and+services" %}
[
  {"@type": "Class", "@id": "Variant", "@subdocument": [],
   "@key": {"@type": "Lexical", "@fields": ["sku"]},
   "sku": "xsd:string", "size": "xsd:string", "colour": "xsd:string"},
  {"@type": "Class", "@id": "Sellable", "@abstract": [],
   "name": "xsd:string", "price": "Money", "status": "Status"},
  {"@type": "Class", "@id": "Product", "@inherits": "Sellable",
   "@key": {"@type": "Lexical", "@fields": ["sku"]},
   "sku": "xsd:string",
   "description": {"@type": "Optional", "@class": "xsd:string"},
   "brand": "Brand",
   "categories": {"@type": "Set", "@class": "Category"},
   "variants": {"@type": "Set", "@class": "Variant"},
   "metadata": {"@type": "Optional", "@class": "sys:JSON"}},
  {"@type": "Class", "@id": "Service", "@inherits": "Sellable",
   "@key": {"@type": "Lexical", "@fields": ["code"]},
   "code": "xsd:string", "duration_minutes": "xsd:integer", "booking_required": "xsd:boolean"}
]
{% http-expected %}
["Variant", "Sellable", "Product", "Service"]
{% /http-expected %}
{% /http-example %}

### Step 5 — Add Assortment {% step %}

An assortment is a set of products for one market or channel, for a period of time. It links to products. It does not copy them, so one product can be in many assortments.

{% http-example method="POST" path="/api/document/admin/shop_model?graph_type=schema&author=admin&message=Add+Assortment" %}
{"@type": "Class", "@id": "Assortment",
 "@key": {"@type": "Lexical", "@fields": ["name"]},
 "name": "xsd:string", "market": "xsd:string",
 "valid_from": "xsd:date",
 "valid_to": {"@type": "Optional", "@class": "xsd:date"},
 "products": {"@type": "Set", "@class": "Product"}}
{% http-expected %}
["Assortment"]
{% /http-expected %}
{% /http-example %}

### Step 6 — Insert documents {% step %}

Now add two categories, one brand, two products of that brand, one service and one assortment. You can send them all in one request, and they can link to each other.

{% http-example method="POST" path="/api/document/admin/shop_model?author=admin&message=Add+first+catalog" %}
[
  {"@type": "Category", "name": "Clothing"},
  {"@type": "Category", "name": "T-shirts", "parent": "Category/Clothing"},
  {"@type": "Brand", "name": "Northwind", "website": "https://northwind.example.com",
   "return_policy": "30 days"},
  {"@type": "Product", "sku": "TS-001", "name": "Basic T-shirt",
   "price": {"@type": "Money", "amount": 19.5, "currency": "EUR"},
   "status": "active", "brand": "Brand/Northwind",
   "categories": ["Category/T-shirts"],
   "variants": [
     {"@type": "Variant", "sku": "TS-001-M", "size": "M", "colour": "white"},
     {"@type": "Variant", "sku": "TS-001-L", "size": "L", "colour": "white"}
   ],
   "metadata": {"fabric": "organic cotton", "fit": "regular"}},
  {"@type": "Product", "sku": "TS-002", "name": "Striped T-shirt",
   "price": {"@type": "Money", "amount": 24.5, "currency": "EUR"},
   "status": "active", "brand": "Brand/Northwind",
   "categories": ["Category/T-shirts"],
   "variants": [
     {"@type": "Variant", "sku": "TS-002-M", "size": "M", "colour": "blue"}
   ]},
  {"@type": "Service", "code": "GIFT-WRAP", "name": "Gift wrapping",
   "price": {"@type": "Money", "amount": 4, "currency": "EUR"},
   "status": "active", "duration_minutes": 10, "booking_required": false},
  {"@type": "Assortment", "name": "summer-nordics", "market": "Nordics",
   "valid_from": "2027-05-01",
   "products": ["Product/TS-001", "Product/TS-002"]}
]
{% http-expected %}
["Category/Clothing", "Category/T-shirts", "Brand/Northwind", "Product/TS-001", "Product/TS-002", "Service/GIFT-WRAP", "Assortment/summer-nordics"]
{% /http-expected %}
{% /http-example %}

The `@id` of each document comes from its `Lexical` key. You did not have to send any `@id`.

### Step 7 — Read a product back {% step %}

Get one product by its `@id`:

{% http-example method="GET" path="/api/document/admin/shop_model?id=Product/TS-001" /%}
{% http-expected %}
{"@id":"Product/TS-001","@type":"Product","brand":"Brand/Northwind","categories":["Category/T-shirts"],"metadata":{"fabric":"organic cotton","fit":"regular"},"name":"Basic T-shirt","price":{"@id":"Product/TS-001/price/Money/EUR","@type":"Money","amount":19.5,"currency":"EUR"},"sku":"TS-001","status":"active","variants":[{"@id":"Product/TS-001/variants/Variant/TS-001-L","@type":"Variant","colour":"white","size":"L","sku":"TS-001-L"},{"@id":"Product/TS-001/variants/Variant/TS-001-M","@type":"Variant","colour":"white","size":"M","sku":"TS-001-M"}]}
{% /http-expected %}

A few things to look at:

- The subdocuments (`price` and the `variants`) come back inside the product. Their `@id` starts with the product's `@id`, because they belong to it.
- `brand` and `categories` are links (an `@id`), not copies.
- A `Set` has no order, so the variants can come back in a different order on your machine.

### Step 8 — Edit the shared brand once {% step %}

The return policy changes to 60 days. Replace the brand document once:

{% http-example method="PUT" path="/api/document/admin/shop_model?author=admin&message=Longer+return+policy" %}
{"@id": "Brand/Northwind", "@type": "Brand", "name": "Northwind",
 "website": "https://northwind.example.com", "return_policy": "60 days"}
{% http-expected %}
["Brand/Northwind"]
{% /http-expected %}
{% /http-example %}

Both products still link to `Brand/Northwind`. You did not touch them, and they now point to a brand with a 60 day return policy. To read a product together with its brand in one call, you can use a [WOQL query](/docs/woql-getting-started/) or [GraphQL](/docs/graphql-basics/).

## Relationships and inheritance

The starter model uses two kinds of relationships:

- **Links** between documents, such as `Product.brand`, `Product.categories`, `Category.parent` and `Assortment.products`. A link is a field whose type is another document class. TerminusDB checks that the linked document exists when you commit.
- **Inheritance** with `@inherits` and `@abstract`. `Product` and `Service` get `name`, `price` and `status` from `Sellable`. You define the shared fields once. Later you can add, for example, a `Bundle` that also inherits from `Sellable`.

Try to keep inheritance shallow. One abstract base with a few concrete classes is easy to understand. For a deep product taxonomy, the [Taxonomy inheritance cookbook](/docs/cookbook-taxonomy-inheritance/) shows a more advanced pattern.

## Extra data without a schema change

New data often arrives before anyone knows its final shape: a supplier sends extra attributes, or a marketing team wants to try a new field. The `metadata` field on `Product` has the type `sys:JSON`. It can hold any JSON, and the schema does not check what is inside. In Step 6, `TS-001` stores `{"fabric": "organic cotton", "fit": "regular"}` there, and `TS-002` has no metadata at all.

You can add a field like this to any class. It is a small escape hatch, so use it with care:

- **Use `metadata`** for data that is new, rare, comes from outside, or is only used by one team or one tool.
- **Promote a field into the real schema** when many documents have it, when other things depend on it (search, filters, prices, reports), or when it must always be valid. For example, if every product gets a `fabric` value and the shop filters on it, add `fabric` as a typed field (or an `Enum`) and move the values over.

The [Schema Reference Guide](/docs/schema-reference-guide/) has more on `sys:JSON` and `sys:JSONDocument`.

## One payment method per order: a tagged union

An order is paid in one way: by card, by invoice, with a gift card, or cash on delivery. It should never have two payment methods, and it should never have none. Each way also needs different data. A card has a brand and the last four digits. An invoice has payment terms and a billing email.

A `TaggedUnion` models this directly. Each choice is one field, and a value sets exactly one of them. TerminusDB checks this rule when you commit, so your application code does not have to. Every program that writes orders gets the same check.

### Step 9 — Add PaymentMethod and Order {% step %}

`Card`, `Invoice` and `GiftCard` are subdocuments with the data for each choice. `PaymentMethod` is the tagged union. It is a subdocument too, because a payment method only makes sense inside its order. The `cash_on_delivery` choice has the type `sys:Unit`, which means "this choice has no data".

{% http-example method="POST" path="/api/document/admin/shop_model?graph_type=schema&author=admin&message=Add+orders+and+payment+methods" %}
[
  {"@type": "Class", "@id": "Card", "@subdocument": [],
   "@key": {"@type": "Random"},
   "brand": "xsd:string", "last4": "xsd:string", "expiry": "xsd:string"},
  {"@type": "Class", "@id": "Invoice", "@subdocument": [],
   "@key": {"@type": "Random"},
   "terms_days": "xsd:integer", "billing_email": "xsd:string"},
  {"@type": "Class", "@id": "GiftCard", "@subdocument": [],
   "@key": {"@type": "Random"},
   "code": "xsd:string", "balance": "Money"},
  {"@type": "TaggedUnion", "@id": "PaymentMethod", "@subdocument": [],
   "@key": {"@type": "Random"},
   "card": "Card", "invoice": "Invoice", "gift_card": "GiftCard",
   "cash_on_delivery": "sys:Unit"},
  {"@type": "Class", "@id": "Order",
   "@key": {"@type": "Lexical", "@fields": ["order_number"]},
   "order_number": "xsd:string",
   "products": {"@type": "Set", "@class": "Product"},
   "total": "Money",
   "payment": "PaymentMethod"}
]
{% http-expected %}
["Card", "Invoice", "GiftCard", "PaymentMethod", "Order"]
{% /http-expected %}
{% /http-example %}

### Step 10 — Insert one order paid by card and one paid by invoice {% step %}

Each `payment` sets one field only: `card` in the first order, `invoice` in the second.

{% http-example method="POST" path="/api/document/admin/shop_model?author=admin&message=Add+first+orders" %}
[
  {"@type": "Order", "order_number": "ORD-1001",
   "products": ["Product/TS-001"],
   "total": {"@type": "Money", "amount": 19.5, "currency": "EUR"},
   "payment": {"@type": "PaymentMethod",
     "card": {"@type": "Card", "brand": "Visa", "last4": "4242", "expiry": "2028-09"}}},
  {"@type": "Order", "order_number": "ORD-1002",
   "products": ["Product/TS-001", "Product/TS-002"],
   "total": {"@type": "Money", "amount": 44, "currency": "EUR"},
   "payment": {"@type": "PaymentMethod",
     "invoice": {"@type": "Invoice", "terms_days": 30, "billing_email": "billing@example.com"}}}
]
{% http-expected %}
["Order/ORD-1001", "Order/ORD-1002"]
{% /http-expected %}
{% /http-example %}

To pay cash on delivery, you would send `"payment": {"@type": "PaymentMethod", "cash_on_delivery": []}`. The empty list `[]` is the value of a `sys:Unit` field.

### Step 11 — Try an order with two payment methods {% step %}

This order sets both `card` and `invoice`. TerminusDB rejects it, and nothing is written:

{% http-example method="POST" path="/api/document/admin/shop_model?author=admin&message=Add+invalid+order" runnable=false %}
{"@type": "Order", "order_number": "ORD-1003",
 "products": ["Product/TS-002"],
 "total": {"@type": "Money", "amount": 24.5, "currency": "EUR"},
 "payment": {"@type": "PaymentMethod",
   "card": {"@type": "Card", "brand": "Visa", "last4": "4242", "expiry": "2028-09"},
   "invoice": {"@type": "Invoice", "terms_days": 30, "billing_email": "billing@example.com"}}}
{% http-expected %}
{"@type":"api:InsertDocumentErrorResponse","api:status":"api:failure","api:message":"Schema check failure","api:error":{"@type":"api:SchemaCheckFailure","api:witnesses":[{"terminusdb:///schema#payment":{"@type":"choice_has_too_many_answers"}}]}}
{% /http-expected %}
{% /http-example %}

We shortened the response. The witness value also has a `choice` field with the choices of the union, and a `document` field with the value you sent. The details can look a little different on your version. If you send a `PaymentMethod` with no choice at all, the witness type is `no_choice_is_cardinality_one` instead.

## Evolve the model safely

Models change. A good habit is to change the schema on a branch, check the result, and only then bring it to main. Here we add an optional `weight_grams` field to `Product` on a branch, and mark one product as discontinued.

### Step 12 — Create a branch {% step %}

{% http-example method="POST" path="/api/branch/admin/shop_model/local/branch/new-fields" %}
{"origin": "admin/shop_model/local/branch/main"}
{% http-expected %}
{"@type":"api:BranchResponse","api:status":"api:success"}
{% /http-expected %}
{% /http-example %}

### Step 13 — Change the schema on the branch {% step %}

Replace the `Product` class with a version that has one more optional field. Because the new field is optional, the existing products stay valid.

{% http-example method="PUT" path="/api/document/admin/shop_model/local/branch/new-fields?graph_type=schema&author=admin&message=Add+weight+to+Product" %}
{"@type": "Class", "@id": "Product", "@inherits": "Sellable",
 "@key": {"@type": "Lexical", "@fields": ["sku"]},
 "sku": "xsd:string",
 "description": {"@type": "Optional", "@class": "xsd:string"},
 "brand": "Brand",
 "categories": {"@type": "Set", "@class": "Category"},
 "variants": {"@type": "Set", "@class": "Variant"},
 "metadata": {"@type": "Optional", "@class": "sys:JSON"},
 "weight_grams": {"@type": "Optional", "@class": "xsd:integer"}}
{% http-expected %}
["Product"]
{% /http-expected %}
{% /http-example %}

### Step 14 — Change a product on the branch {% step %}

{% http-example method="PUT" path="/api/document/admin/shop_model/local/branch/new-fields?author=admin&message=Discontinue+TS-002" %}
{"@id": "Product/TS-002", "@type": "Product", "sku": "TS-002", "name": "Striped T-shirt",
 "price": {"@type": "Money", "amount": 24.5, "currency": "EUR"},
 "status": "discontinued", "brand": "Brand/Northwind",
 "categories": ["Category/T-shirts"],
 "variants": [
   {"@type": "Variant", "sku": "TS-002-M", "size": "M", "colour": "blue"}
 ]}
{% http-expected %}
["Product/TS-002"]
{% /http-expected %}
{% /http-example %}

### Step 15 — See what changed {% step %}

Compare the branch with main:

{% http-example method="POST" path="/api/diff/admin/shop_model" %}
{"before_data_version": "main", "after_data_version": "new-fields"}
{% http-expected %}
[{"@id": "Product/TS-002", "status": {"@op": "SwapValue", "@before": "active", "@after": "discontinued"}}]
{% /http-expected %}
{% /http-example %}

The diff shows the document change: one field, from `active` to `discontinued`. To look at the new schema, read it from the branch:

{% http-example method="GET" path="/api/document/admin/shop_model/local/branch/new-fields?graph_type=schema&id=Product" /%}
{% http-expected %}
{"@id":"Product","@inherits":"Sellable","@key":{"@fields":["sku"],"@type":"Lexical"},"@type":"Class","brand":"Brand","categories":{"@class":"Category","@type":"Set"},"description":{"@class":"xsd:string","@type":"Optional"},"metadata":{"@class":"sys:JSON","@type":"Optional"},"sku":"xsd:string","variants":{"@class":"Variant","@type":"Set"},"weight_grams":{"@class":"xsd:integer","@type":"Optional"}}
{% /http-expected %}

When you are happy with the change, you can bring it to main with a merge (see [Branch](/docs/branch/)). For bigger changes, such as renaming a field or making an optional field required, have a look at the [Schema Migration Reference](/docs/schema-migration-reference-guide/). If your data does not fit the schema, the [Data Model Mismatches](/docs/troubleshooting-data-model/) page may help.

### Step 16 — Clean up {% step %}

This deletes the **shop_model** database. Only run it when you are done:

{% http-example method="DELETE" path="/api/db/admin/shop_model" confirm="This will permanently delete the shop_model database." /%}
{% http-expected %}
{"@type":"api:DbDeleteResponse","api:status":"api:success"}
{% /http-expected %}

## Get help

Need help with your own model? For dynamic assortments, hubs with pull request workflows and similar work, we and our partners can help. {% cta-link href="https://gettier.ai/connect" event="ecommerce_data_model_contact" %}Contact us{% /cta-link %} and tell us what you are building.

## Next steps

- [Explore an Ecommerce Dataset](/docs/explore-ecommerce-dataset/) — query, branch and diff a ready-made model with customers and orders
- [Use the Model Builder UI](/docs/use-the-model-builder-ui/) — build this model in the dashboard instead of with curl
- [Add a Schema](/docs/add-a-schema/) and the [Schema Reference Guide](/docs/schema-reference-guide/) — all key types and schema syntax
- [Documents explanation](/docs/documents-explanation/) — documents and subdocuments in more depth
- [Taxonomy inheritance cookbook](/docs/cookbook-taxonomy-inheritance/) — product taxonomies with inheritance
- [How to Model Schema](/docs/model-schema/) — more how-to guides for schema modelling
