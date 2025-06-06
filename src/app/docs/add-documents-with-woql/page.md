---
nextjs:
  metadata:
    title: How to add documents using WOQL
    description: >-
      A how-to guide  with an example showing how to add documents using a WOQL
      query.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/woql-add-documents.png
---

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

## Create and link a subdocument

Subdocuments have two components linking them to their parent, one triple, and one subdocument, which are required by the schema checker to accept the document. The triple links the parent with the subdocument, and the subdocument is linked to the parent using the special property `@linked-by`.

Simple example for adding a subdocument:

```javascript
and(
  insert_document(new doc({"@type": "PersonRole", "@linked-by": {"@id": "Person/John", "@property": "role"}}), "v:SubdocumentId"),
  add_triple("Person/John", "role", "v:SubdocumentId"),
)
```

## Delete a subdocument

Subdocuments can be deleted using the `delete_document` keyword, but it's important to also delete the triple that links the subdocument from the parent document. Here we resolve the parent document in the variable `v:parentdoc`.

```javascript
and(
  eq("v:subdoc", "Person/John/role/PersonRole/cxW1Egirxm8-QYrq"),
  triple("v:parentdoc", "role", "v:subdoc"),
  delete_document("v:subdoc"),
  delete_triple("v:parentdoc", "role", "v:subdoc"),
)
```

## Update a subdocument

Let's combine creating and deleting a document into a single query to update the subdocument.

Subdocuments can't be updated in place using the `update_document` keyword which exists only for top level documents. You can update a subdocument by deleting the old subdocument and creating a new one with the updated content, including the `@linked-by` property, and updating the triple that links the subdocument.

This in place operation is only possible using random keyed identifiers on the subdocument. The alternative is to update the top level document.

```javascript
select("v:oldsubdoc", "v:newsubdoc").
and(
    eq("v:subdoc", "Person/John/role/PersonRole/cxW1Egirxm8-QYrq"),
    and(
        triple("v:parentdoc", "role", "v:oldsubdoc"),

        delete_document("v:oldsubdoc"),
        insert_document(new doc({"@type": "PersonRole", "@linked-by": {"@id": "v:parentdoc", "@property": "role"}}),"v:newsubdoc"),
        
        update_triple("v:parentdoc", "role", "v:newsubdoc", "v:oldsubdoc"),
    )
)
```

The parent document is resolved for the specific predicate, the old document gets deleted and a new document is created, linked to the parent document and the triple that links from the parent document is updated.

The old and new subdocuments are provided in the returned bindings via the selections of variables to return.










