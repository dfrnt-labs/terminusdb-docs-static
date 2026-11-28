---
tags:
  - schema
  - tutorial
  - curl
  - woql
  - advanced
title: Advanced Product Taxonomy
nextjs:
  metadata:
    title: "Advanced Product Taxonomy: Traits, Mixins and Inherited Attributes"
    description: Build an advanced product taxonomy with curl, JSON and WOQL. Model behavioral traits such as Perishable and Fragile as abstract mixin classes, inherit their attributes, and materialize the full taxonomy.
    keywords: advanced product taxonomy, product traits, mixin classes, abstract classes, multiple inheritance, taxonomy materialization
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.com/docs/advanced-product-taxonomy/
media: []
---

An advanced product taxonomy adds rules that cut across the category tree. Cheese and juice are in different places in the tree, but both spoil. Wine and wine glasses are far apart, but both break. TerminusDB is the open-source knowledge graph database with git-like version control for graphs and vectors. This page shows how to model such rules as **traits**, mix them into the taxonomy, and query them with WOQL.

Start with the [product taxonomy data model](/docs/product-taxonomy-data-model/) if you are new to taxonomies in TerminusDB. That page models the taxonomy as category documents. Here we model the taxonomy as classes in the schema, so that the classes can inherit fields.

## One tree, many traits

We keep two things apart:

1. **The taxonomy tree.** Each taxonomy class has exactly one parent in the tree, for example *Item → Grocery → Dairy → Cheese*. The tree stays strict and simple.
2. **Behavioral traits.** A trait describes how an item behaves, for example *Perishable*, *Fragile* or *AgeRestricted*. A trait has its own attributes, such as `shelf_life_days` or `min_age`. A trait is not a place in the tree.

A taxonomy class can mix in zero, one or more traits. Everything below that class then inherits the trait and its attributes. Some people call this a mixin.

In the schema, both parts use `@inherits`. A class can inherit from more than one class (see [multiple inheritance](/docs/schema-reference-guide/#multiple-inheritance)). We use one `@inherits` entry for the parent in the tree, and one more entry for each trait.

Traits are `@abstract` classes. An [abstract class](/docs/schema-reference-guide/#abstract) has no documents of its own. It only gives fields to the classes that inherit from it. So you can never insert "a Perishable" on its own, only a cheese or a juice that is perishable.

## Classes in the model

| Class | Kind | Inherits from | Own fields |
|-------|------|---------------|------------|
| `Perishable` | trait, abstract | — | `shelf_life_days` |
| `Fragile` | trait, abstract | — | `handling_code` |
| `AgeRestricted` | trait, abstract | — | `min_age` |
| `Item` | taxonomy root, abstract | — | `sku`, `name`, `price` |
| `Grocery` | taxonomy, abstract | `Item` | — |
| `Dairy` | taxonomy, abstract | `Grocery`, `Perishable` | — |
| `Cheese` | taxonomy, concrete | `Dairy` | — |
| `Beverage` | taxonomy, abstract | `Grocery` | — |
| `Juice` | taxonomy, concrete | `Beverage`, `Perishable` | — |
| `Wine` | taxonomy, concrete | `Beverage`, `Fragile`, `AgeRestricted` | — |
| `Home` | taxonomy, abstract | `Item` | — |
| `Glassware` | taxonomy, concrete | `Home`, `Fragile` | — |
| `Towel` | taxonomy, concrete | `Home` | — |

This is the tree. The traits are in brackets:

```text
Item
├── Grocery
│   ├── Dairy            [Perishable]
│   │   └── Cheese       (inherits Perishable from Dairy)
│   └── Beverage
│       ├── Juice        [Perishable]
│       └── Wine         [Fragile, AgeRestricted]
└── Home
    ├── Glassware        [Fragile]
    └── Towel
```

Look at *Cheese*: it does not name a trait itself. It gets `shelf_life_days` from *Dairy*, which gets it from *Perishable*. This is how a trait flows down the tree.

Two rules from the [schema reference](/docs/schema-reference-guide/) are good to know:

- **Keys are not inherited.** So each concrete class sets its own `@key`. We use a `Lexical` key on `sku` for each of them.
- **Field names must agree.** With multiple inheritance, two inherited fields with the same name must have the same type, or the schema check fails. Our traits use different field names, so there is no conflict.

## Build it step by step

Every step is a curl call against a local TerminusDB on `http://localhost:6363` with the default user `admin:root`. Each step shows the JSON body and the response you should get. The WOQL steps also show the same query with the JavaScript client.

{% prerequisites-connected /%}

### Step 1 — Create a database {% step %}

{% http-example method="POST" path="/api/db/admin/trait_taxonomy" %}
{"label": "Trait taxonomy", "comment": "Advanced product taxonomy tutorial"}
{% http-expected %}
{"@type":"api:DbCreateResponse","api:status":"api:success"}
{% /http-expected %}
{% /http-example %}

### Step 2 — Add the traits and the taxonomy classes {% step %}

The traits and all taxonomy classes above the leaves have `"@abstract": []`. Only the leaves are concrete and have a key:

{% http-example method="POST" path="/api/document/admin/trait_taxonomy?graph_type=schema&author=admin&message=Add+traits+and+taxonomy" %}
[
  {"@type": "Class", "@id": "Perishable", "@abstract": [],
   "shelf_life_days": "xsd:integer"},
  {"@type": "Class", "@id": "Fragile", "@abstract": [],
   "handling_code": "xsd:string"},
  {"@type": "Class", "@id": "AgeRestricted", "@abstract": [],
   "min_age": "xsd:integer"},
  {"@type": "Class", "@id": "Item", "@abstract": [],
   "sku": "xsd:string", "name": "xsd:string", "price": "xsd:decimal"},
  {"@type": "Class", "@id": "Grocery", "@abstract": [], "@inherits": ["Item"]},
  {"@type": "Class", "@id": "Dairy", "@abstract": [], "@inherits": ["Grocery", "Perishable"]},
  {"@type": "Class", "@id": "Cheese", "@inherits": ["Dairy"],
   "@key": {"@type": "Lexical", "@fields": ["sku"]}},
  {"@type": "Class", "@id": "Beverage", "@abstract": [], "@inherits": ["Grocery"]},
  {"@type": "Class", "@id": "Juice", "@inherits": ["Beverage", "Perishable"],
   "@key": {"@type": "Lexical", "@fields": ["sku"]}},
  {"@type": "Class", "@id": "Wine", "@inherits": ["Beverage", "Fragile", "AgeRestricted"],
   "@key": {"@type": "Lexical", "@fields": ["sku"]}},
  {"@type": "Class", "@id": "Home", "@abstract": [], "@inherits": ["Item"]},
  {"@type": "Class", "@id": "Glassware", "@inherits": ["Home", "Fragile"],
   "@key": {"@type": "Lexical", "@fields": ["sku"]}},
  {"@type": "Class", "@id": "Towel", "@inherits": ["Home"],
   "@key": {"@type": "Lexical", "@fields": ["sku"]}}
]
{% http-expected %}
["Perishable", "Fragile", "AgeRestricted", "Item", "Grocery", "Dairy", "Cheese", "Beverage", "Juice", "Wine", "Home", "Glassware", "Towel"]
{% /http-expected %}
{% /http-example %}

### Step 3 — Check the inherited fields of a class {% step %}

The [schema endpoint](/docs/document-insertion/#the-schema-endpoint) shows the frame of a class, with all the fields it has, also the inherited ones:

{% http-example method="GET" path="/api/schema/admin/trait_taxonomy?type=Cheese" /%}

The response is a JSON object for `Cheese`. It should list `sku`, `name` and `price` from *Item*, and `shelf_life_days` from *Perishable*, even though the `Cheese` class itself has no fields. Try `type=Wine` to see `handling_code` and `min_age`.

### Step 4 — Write documents with trait attributes {% step %}

You write the inherited attributes in the document, the same way as its own fields. Each document must have all the fields its class inherits. A cheese without `shelf_life_days` fails the schema check:

{% http-example method="POST" path="/api/document/admin/trait_taxonomy?author=admin&message=Add+items" %}
[
  {"@type": "Cheese", "sku": "CH-001", "name": "Aged cheddar 200 g", "price": 4.5,
   "shelf_life_days": 60},
  {"@type": "Juice", "sku": "JU-001", "name": "Apple juice 1 l", "price": 2.1,
   "shelf_life_days": 14},
  {"@type": "Wine", "sku": "WN-001", "name": "Rioja 2019 0.75 l", "price": 12.9,
   "handling_code": "GLASS-UPRIGHT", "min_age": 18},
  {"@type": "Glassware", "sku": "GL-001", "name": "Wine glass set of 4", "price": 24,
   "handling_code": "GLASS-UPRIGHT"},
  {"@type": "Towel", "sku": "TW-001", "name": "Cotton bath towel", "price": 9.9}
]
{% http-expected %}
["Cheese/CH-001", "Juice/JU-001", "Wine/WN-001", "Glassware/GL-001", "Towel/TW-001"]
{% /http-expected %}
{% /http-example %}

The towel has no trait, so it only has the fields from *Item*.

## Query traits with WOQL

Now we use [WOQL](/docs/woql-explanation/), the TerminusDB query language. Two WOQL words do most of the work here:

- **`isa(X, C)`** matches documents `X` of class `C` **or any class below it**. So `isa` with *Perishable* finds cheese and juice, even though no document has the class *Perishable*.
- **`sub(Parent, Child)`** (in JSON: `Subsumption`) is true when the class `Child` inherits from `Parent`, directly or through other classes. A class also counts as a subclass of itself.

You send the JSON form of a query to the `/api/woql` endpoint, inside a `query` field. See the [WOQL class reference](/docs/woql-class-reference-guide/) for all the parts.

### Step 5 — Select all perishable items {% step %}

{% http-example method="POST" path="/api/woql/admin/trait_taxonomy/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";

const client = new TerminusClient.WOQLClient("http://localhost:6363", {
  user: "admin",
  organization: "admin",
  key: "root",
});
client.db("trait_taxonomy");

const WOQL = TerminusClient.WOQL;
const query = WOQL.order_by("v:Name").and(
  WOQL.isa("v:Item", "@schema:Perishable"),
  WOQL.triple("v:Item", "name", "v:Name"),
  WOQL.triple("v:Item", "shelf_life_days", "v:ShelfLifeDays")
);

const result = await client.query(query);
console.log(result.bindings);
{% /http-woql %}
```json
{"query":{"@type":"OrderBy","ordering":[{"@type":"OrderTemplate","variable":"Name","order":"asc"}],"query":{"@type":"And","and":[{"@type":"IsA","element":{"@type":"NodeValue","variable":"Item"},"type":{"@type":"NodeValue","node":"@schema:Perishable"}},{"@type":"Triple","subject":{"@type":"NodeValue","variable":"Item"},"predicate":{"@type":"NodeValue","node":"name"},"object":{"@type":"Value","variable":"Name"}},{"@type":"Triple","subject":{"@type":"NodeValue","variable":"Item"},"predicate":{"@type":"NodeValue","node":"shelf_life_days"},"object":{"@type":"Value","variable":"ShelfLifeDays"}}]}}}
```
{% http-expected %}
[{"Name": "Aged cheddar 200 g", "ShelfLifeDays": 60}, {"Name": "Apple juice 1 l", "ShelfLifeDays": 14}]
{% /http-expected %}
{% /http-example %}

The cheese is in the result, because *Cheese* inherits *Perishable* through *Dairy*. Each binding also has an `Item` field with the document ID, such as `Cheese/CH-001`.

### Step 6 — Select all fragile items and their handling code {% step %}

The same pattern works for every trait. Here a warehouse wants all items that need careful handling. They come from two different branches of the tree:

{% http-example method="POST" path="/api/woql/admin/trait_taxonomy/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";

const client = new TerminusClient.WOQLClient("http://localhost:6363", {
  user: "admin",
  organization: "admin",
  key: "root",
});
client.db("trait_taxonomy");

const WOQL = TerminusClient.WOQL;
const query = WOQL.order_by("v:Name").and(
  WOQL.isa("v:Item", "@schema:Fragile"),
  WOQL.triple("v:Item", "name", "v:Name"),
  WOQL.triple("v:Item", "handling_code", "v:HandlingCode")
);

const result = await client.query(query);
console.log(result.bindings);
{% /http-woql %}
```json
{"query":{"@type":"OrderBy","ordering":[{"@type":"OrderTemplate","variable":"Name","order":"asc"}],"query":{"@type":"And","and":[{"@type":"IsA","element":{"@type":"NodeValue","variable":"Item"},"type":{"@type":"NodeValue","node":"@schema:Fragile"}},{"@type":"Triple","subject":{"@type":"NodeValue","variable":"Item"},"predicate":{"@type":"NodeValue","node":"name"},"object":{"@type":"Value","variable":"Name"}},{"@type":"Triple","subject":{"@type":"NodeValue","variable":"Item"},"predicate":{"@type":"NodeValue","node":"handling_code"},"object":{"@type":"Value","variable":"HandlingCode"}}]}}}
```
{% http-expected %}
[{"Name": "Rioja 2019 0.75 l", "HandlingCode": "GLASS-UPRIGHT"}, {"Name": "Wine glass set of 4", "HandlingCode": "GLASS-UPRIGHT"}]
{% /http-expected %}
{% /http-example %}

## Materialize the full taxonomy

Sometimes you want the whole taxonomy in one result, for example to build a search index or to feed another system. For each class we want two lists:

- **Path:** the class and all its ancestors in the taxonomy tree, up to *Item*.
- **Traits:** all traits the class has, its own and the inherited ones.

Both come from `sub`. The ancestors of a class are all classes that it inherits from. If an ancestor is below *Item*, it is part of the tree. If not, it is a trait. The `collect` word gathers the answers of a small query into a list.

### Step 7 — Materialize all taxonomy classes {% step %}

This query reads only the schema, so it also lists the abstract classes, which have no documents:

{% http-example method="POST" path="/api/woql/admin/trait_taxonomy/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";

const client = new TerminusClient.WOQLClient("http://localhost:6363", {
  user: "admin",
  organization: "admin",
  key: "root",
});
client.db("trait_taxonomy");

const WOQL = TerminusClient.WOQL;
const query = WOQL.and(
  // every class in the taxonomy tree
  WOQL.sub("@schema:Item", "v:Class"),
  // its ancestors that are in the tree
  WOQL.collect("v:Ancestor", "v:Path", WOQL.and(
    WOQL.sub("v:Ancestor", "v:Class"),
    WOQL.sub("@schema:Item", "v:Ancestor")
  )),
  // its ancestors that are not in the tree: the traits
  WOQL.collect("v:Trait", "v:Traits", WOQL.and(
    WOQL.sub("v:Trait", "v:Class"),
    WOQL.not().sub("@schema:Item", "v:Trait")
  ))
);

const result = await client.query(query);
console.log(result.bindings);
{% /http-woql %}
```json
{"query":{"@type":"And","and":[{"@type":"Subsumption","parent":{"@type":"NodeValue","node":"@schema:Item"},"child":{"@type":"NodeValue","variable":"Class"}},{"@type":"Collect","template":["Ancestor"],"into":{"@type":"Value","variable":"Path"},"query":{"@type":"And","and":[{"@type":"Subsumption","parent":{"@type":"NodeValue","variable":"Ancestor"},"child":{"@type":"NodeValue","variable":"Class"}},{"@type":"Subsumption","parent":{"@type":"NodeValue","node":"@schema:Item"},"child":{"@type":"NodeValue","variable":"Ancestor"}}]}},{"@type":"Collect","template":["Trait"],"into":{"@type":"Value","variable":"Traits"},"query":{"@type":"And","and":[{"@type":"Subsumption","parent":{"@type":"NodeValue","variable":"Trait"},"child":{"@type":"NodeValue","variable":"Class"}},{"@type":"Not","query":{"@type":"Subsumption","parent":{"@type":"NodeValue","node":"@schema:Item"},"child":{"@type":"NodeValue","variable":"Trait"}}}]}}]}}
```
{% /http-example %}

You should get one binding for each of the 10 taxonomy classes, from *Item* to *Towel*. The traits themselves are not in the result, because they are not below *Item*. A binding has a `Class`, a `Path` list and a `Traits` list. The class names come back as schema IRIs, so they can look like `@schema:Wine`. For *Wine*, the binding should hold:

- `Path`: Wine, Beverage, Grocery and Item
- `Traits`: AgeRestricted and Fragile

For *Cheese*, `Traits` holds only Perishable, and for *Towel* and *Item* it is an empty list. The lists are sets: please do not depend on the order of the classes in them. If you need the tree order, you can count the length of the `Path` list of each class: the longer the list, the deeper the class.

### Step 8 — Materialize the taxonomy for each item {% step %}

The same idea works for documents. `triple` with `rdf:type` gives the class of each document. Then we collect the path and traits of that class:

{% http-example method="POST" path="/api/woql/admin/trait_taxonomy/local/branch/main" %}
{% http-woql %}
import TerminusClient from "@terminusdb/terminusdb-client";

const client = new TerminusClient.WOQLClient("http://localhost:6363", {
  user: "admin",
  organization: "admin",
  key: "root",
});
client.db("trait_taxonomy");

const WOQL = TerminusClient.WOQL;
const query = WOQL.order_by("v:Name").and(
  WOQL.isa("v:Item", "@schema:Item"),
  WOQL.triple("v:Item", "name", "v:Name"),
  WOQL.triple("v:Item", "rdf:type", "v:Class"),
  WOQL.collect("v:Ancestor", "v:Path", WOQL.and(
    WOQL.sub("v:Ancestor", "v:Class"),
    WOQL.sub("@schema:Item", "v:Ancestor")
  )),
  WOQL.collect("v:Trait", "v:Traits", WOQL.and(
    WOQL.sub("v:Trait", "v:Class"),
    WOQL.not().sub("@schema:Item", "v:Trait")
  ))
);

const result = await client.query(query);
console.log(result.bindings);
{% /http-woql %}
```json
{"query":{"@type":"OrderBy","ordering":[{"@type":"OrderTemplate","variable":"Name","order":"asc"}],"query":{"@type":"And","and":[{"@type":"IsA","element":{"@type":"NodeValue","variable":"Item"},"type":{"@type":"NodeValue","node":"@schema:Item"}},{"@type":"Triple","subject":{"@type":"NodeValue","variable":"Item"},"predicate":{"@type":"NodeValue","node":"name"},"object":{"@type":"Value","variable":"Name"}},{"@type":"Triple","subject":{"@type":"NodeValue","variable":"Item"},"predicate":{"@type":"NodeValue","node":"rdf:type"},"object":{"@type":"Value","variable":"Class"}},{"@type":"Collect","template":["Ancestor"],"into":{"@type":"Value","variable":"Path"},"query":{"@type":"And","and":[{"@type":"Subsumption","parent":{"@type":"NodeValue","variable":"Ancestor"},"child":{"@type":"NodeValue","variable":"Class"}},{"@type":"Subsumption","parent":{"@type":"NodeValue","node":"@schema:Item"},"child":{"@type":"NodeValue","variable":"Ancestor"}}]}},{"@type":"Collect","template":["Trait"],"into":{"@type":"Value","variable":"Traits"},"query":{"@type":"And","and":[{"@type":"Subsumption","parent":{"@type":"NodeValue","variable":"Trait"},"child":{"@type":"NodeValue","variable":"Class"}},{"@type":"Not","query":{"@type":"Subsumption","parent":{"@type":"NodeValue","node":"@schema:Item"},"child":{"@type":"NodeValue","variable":"Trait"}}}]}}]}}}
```
{% /http-example %}

You should get five bindings, one for each item, sorted by name. Each has `Item`, `Name`, `Class`, `Path` and `Traits`. For *Aged cheddar 200 g*, `Class` is Cheese, `Path` holds Cheese, Dairy, Grocery and Item, and `Traits` holds Perishable. For *Cotton bath towel*, `Traits` is empty.

This is a full materialization of the taxonomy for your items. You can store it, send it to a search engine, or use it to set rules in the shop: show an age check for every item with *AgeRestricted*, or a "keep cool" label for every item with *Perishable*.

### Step 9 — Clean up {% step %}

This deletes the **trait_taxonomy** database. Only run it when you are done:

{% http-example method="DELETE" path="/api/db/admin/trait_taxonomy" confirm="This will permanently delete the trait_taxonomy database." /%}
{% http-expected %}
{"@type":"api:DbDeleteResponse","api:status":"api:success"}
{% /http-expected %}

## When to use traits, and when not

Traits are a good fit for behavior that the schema should check, such as "every perishable item has a shelf life". Each document must then have the attribute, and the queries can rely on it.

Traits are schema changes. If your taxonomy changes every week, or business users edit it, it can be easier to keep the categories as documents, as in the [product taxonomy data model](/docs/product-taxonomy-data-model/). You can also combine the two: a category document for the navigation, and a trait class for the behavior. You can test a schema change on a [branch](/docs/branch/) first, in the same way as a data change.

## More reading

- [Product taxonomy data model](/docs/product-taxonomy-data-model/) — the entry-level page: a simple category tree, path queries, and changes on a branch
- [Taxonomy inheritance cookbook](/docs/cookbook-taxonomy-inheritance/) — inherit values, such as a data steward, from a place in the taxonomy at query time
- [Schema Reference Guide](/docs/schema-reference-guide/) — `@abstract`, `@inherits` and multiple inheritance
- [WOQL Class Reference Guide](/docs/woql-class-reference-guide/) — `IsA`, `Subsumption`, `Collect` and the other query parts
- [E-commerce Data Model](/docs/ecommerce-data-model/) — a starter schema for products, variants, brands and orders
