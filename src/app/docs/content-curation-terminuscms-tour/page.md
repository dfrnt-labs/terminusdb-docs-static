---
title: Content & Data Curation in TerminusCMS
slug: content-curation-terminuscms-tour
seo:
  title: Content & Data Curation - TerminusCMS Tour
  description: >-
    Technical and non-technical users can curate content and data using the
    TerminusCMS dashboard
  og_image: >-
    https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media:
  - alt: TerminusCMS document explorer
    caption: ''
    media_type: Image
    title: TerminusCMS document explorer
    value: https://assets.terminusdb.com/docs/document-explorer.png
  - alt: Document display
    caption: ''
    media_type: Image
    title: Document display
    value: https://assets.terminusdb.com/docs/document-display.png
  - alt: GraphQL query generated from filter results
    caption: ''
    media_type: Image
    title: GraphQL query generated from filter results
    value: https://assets.terminusdb.com/docs/document-view-graphql-query.png
  - alt: ''
    caption: ''
    media_type: Image
    title: Image 4
    value: https://assets.terminusdb.com/docs/add-new-document.png
  - alt: Linking to other documents
    caption: ''
    media_type: Image
    title: Linking to other documents
    value: https://assets.terminusdb.com/docs/linking-to-other-documents.png
  - alt: 'Unfolded documents '
    caption: ''
    media_type: Image
    title: 'Unfolded documents '
    value: https://assets.terminusdb.com/docs/unfolded-documents.png
  - alt: How to edit documents in the TerminusCMS dashboard
    caption: ''
    media_type: Image
    title: How to edit documents in the TerminusCMS dashboard
    value: https://assets.terminusdb.com/docs/edit-documents.png
---

TerminusCMS automatically generates document editing frames from the schema. Users can then add, edit, and delete content and data as needed.

First, navigate to the document explorer from the left menu -

![TerminusCMS document explorer](https://assets.terminusdb.com/docs/document-explorer.png)

The document explorer lists all of the document types within the schema and displays how many of each there are.

The left-hand menu also details the document names with the ability to search for something specific.

## Filtering and Searching Documents

Clicking on a document type displays a list of matching documents -

![Document display](https://assets.terminusdb.com/docs/document-display.png)

The document table allows users to -

*   Choose the properties to display in the table
*   Search properties
*   Perform advanced filters

## GraphQL Query

The GraphQL tab provides front-end developers with an overview of the GraphQL query structure of the document and includes JSON-LD details for applied filters -

![GraphQL query generated from filter results](https://assets.terminusdb.com/docs/document-view-graphql-query.png)

## Adding, Editing, & Deleting Docs

In order to make changes to content and data, users need to create a change request. This is automated when selecting to edit, delete, or add content. Please refer to the [change request workflows section](/docs/change-request-workflows-terminuscms-tour/) for full details.

A change request dialogue box opens and prompts the user to add a change request title and description. They can then go and make changes.

### Adding Content & Data

To add content and data, either click on the + symbol next to the document type name from the left menu or select the 'add new' button from the document explorer page -

![](https://assets.terminusdb.com/docs/add-new-document.png)

The document editing frame is generated from the schema and this includes things like -

*   Validation
*   Localization
*   Markdown
*   Property types such as data, currency, and lists.

The editing interface can also include links to other documents and subdocuments and this is all specified in the schema. The example below is a test project working on the TerminusDB documentation and features links to other document types.

A page for example can link to sections and a body so the same piece of content can be used in multiple locations. The schema can also specify that the linked document types unfolded so they display ready for editing within a piece of content -

![Linking to other documents](https://assets.terminusdb.com/docs/linking-to-other-documents.png)

![Unfolded documents ](https://assets.terminusdb.com/docs/unfolded-documents.png)

For details on how to specify markdown, unfolded, and other properties within the schema, please read the [schema reference guide](/docs/schema-reference-guide/).

### Editing and Deleting Content & Data

To edit a document, select the document to edit by clicking on it from the document explorer. This will open up the document for editing.

Make the changes and ensure to press select submit to ensure changes are saved.

![How to edit documents in the TerminusCMS dashboard](https://assets.terminusdb.com/docs/edit-documents.png)

To delete a document, select the red bin icon. A warning message will display to confirm the deletion.