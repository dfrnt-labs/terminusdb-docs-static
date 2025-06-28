---
title: How to add and delete documents and subdocuments using WOQL
nextjs:
  metadata:
    title: How to add and delete documents and subdocuments using WOQL
    description: A how-to guide  with an example showing how to add documents and subdocuments using a WOQL query.
    openGraph:
      images: https://assets.terminusdb.com/docs/woql-add-documents.png
    alternates:
      canonical: https://terminusdb.org/docs/add-documents-with-woql/
---

# Add Documents with WOQL

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on DFRNT TerminusDB cloud. You will then have full access to the data needed for this tutorial.

## Add a document in WOQL

You can add a document in WOQL using the `insert_document` keyword.

```javascript
let v = Vars("id");
insert_document(doc({'@type' : 'Planet', label: 'Planet-X'}), v.id)
```

We can also add documents by using a variable. For instance, we can create a new planet for each individual in the star wars universe as follows:

```javascript
let v = Vars("person", "name");
and(isa(v.person, "People"),
    triple(v.person,"label",v.name),
    insert_document(doc({'@type' : 'Planet', label: v.name})))
```

## Create and link a subdocument in WOQL

Subdocuments have two components linking them to their parent, one triple, and one subdocument, which are required by the schema checker to accept the document. The triple links the parent with the subdocument, and the subdocument is linked to the parent using the special property `@linked-by`.

Simple example for adding a subdocument:

```javascript
and(
  insert_document(new doc({"@type": "PersonRole", "@linked-by": {"@id": "Person/John", "@property": "role"}}), "v:SubdocumentId"),
  add_triple("Person/John", "role", "v:SubdocumentId"),
)
```
