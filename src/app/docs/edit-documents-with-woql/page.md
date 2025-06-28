---
title: Edit Documents using WOQL
nextjs:
  metadata:
    title: Edit Documents using WOQL
    description: A guide with example showing how to edit documents using WOQL
    openGraph:
      images: https://assets.terminusdb.com/docs/woql-edit-documents.png
    alternates:
      canonical: https://terminusdb.org/docs/edit-documents-with-woql/
media: []
---

> To use this HowTo, first [clone the Star Wars demo](/docs/clone-a-demo-terminuscms-project/) into your team on DFRNT TerminusDB cloud. You will then have full access to the data needed for this tutorial.

We can get a document by Id, by using `read_document`. For instance, we can write:

```javascript
let v = Vars("doc", "id");
and(isa(v.id, "People"),
    triple(v.id, "label", string("Bossk")),
    read_document(v.id, v.doc))
```

We can also add documents by using a variable. For instance, we can create a new planet for each individual in the star wars universe as follows:

```javascript
let v = Vars("person", "name");
and(isa(v.person, "People"),
    triple(v.person,"label",v.name),
    insert_document(doc({'@type' : 'Planet', label: v.name})))
```

## Update a document in WOQL

You can update a document in WOQL using the `update_document` keyword.

```javascript
let v = Vars("id");
and(
  eq(v.id, "Planet/01dd97a75800f01f43ab7ab55b6dd08f198dd34d2bdbbeeb7bf4edee45111863"),
  update_document(doc({'@type' : 'Planet', label: 'Planet-X'}), v.id)
)
```

## Update a subdocument in WOQL

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
