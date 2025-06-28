---
title: Projects Overview - TerminusDB Tour
nextjs:
  metadata:
    title: Projects Overview - TerminusDB Tour
    description: How to add and manage projects/data products within TerminusDB
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/projects-terminuscms-tour/
media:
  - alt: Create a new data product
    caption: ""
    media_type: Image
    title: Create a new data product
    value: https://assets.terminusdb.com/docs/new-data-product2.png
  - alt: UI schema builder
    caption: ""
    media_type: Image
    title: UI schema builder
    value: https://assets.terminusdb.com/docs/schema-graph-view.png
  - alt: Develop a schema with code
    caption: ""
    media_type: Image
    title: Develop a schema with code
    value: https://assets.terminusdb.com/docs/schema-as-code.png
  - alt: Manage your project
    caption: ""
    media_type: Image
    title: Manage your project
    value: https://assets.terminusdb.com/docs/project-admin.png
  - alt: Time travel to a previous commit
    caption: ""
    media_type: Image
    title: Time travel to a previous commit
    value: https://assets.terminusdb.com/docs/time-travel2.png
  - alt: Branch the project
    caption: ""
    media_type: Image
    title: Branch the project
    value: https://assets.terminusdb.com/docs/branch-project.png
  - alt: Branch Options
    caption: ""
    media_type: Image
    title: Branch Options
    value: https://assets.terminusdb.com/docs/branch-options.png
  - alt: Reset the project
    caption: ""
    media_type: Image
    title: Reset the project
    value: https://assets.terminusdb.com/docs/reset-to-commit.png
---

## Create a new data product

Creating a data product by -

1.  Select ‘New Data Product’
2.  Give it an ID (only alphanumeric characters and underscores are allowed)
3.  Name it something meaningful
4.  Give it a description so that team members can see its purpose.

![Create a new data product](https://assets.terminusdb.com/docs/new-data-product2.png)

All projects/data products within a team are listed on the left.

Select the data product by clicking it.

## Adding a Schema

Build a project's schemas using the user interface or develop it in code.

For a detailed overview of the schema language, which is based on JSON syntax refer to the [schema reference guide](/docs/schema-reference-guide/).

### Visual Interface

![UI schema builder](https://assets.terminusdb.com/docs/schema-graph-view.png)

1.  Choose Data Product Model from the lefthand menu - the second icon
2.  In the window, you will see an oval called your data product name schema. Click on the oval and select the + symbol
3.  Add a document or enum

*   JSON documents form the nodes of the graph
*   Enumerated types are a set of possible choices

5.  Select add document
6.  On the right, you will see a set of options to define the document

*   Give it a unique ID (no spaces)
*   Define the document key, choose from [this blog will help you decide what key to use](https://terminusdb.com/blog/uri-generation/)

*   Lexical (need to set up document properties first)
*   Hash (need to set up document properties first)
*   Random
*   ValueHash

8.  Add the document properties, choose from:

*   Enum - Need to create the enums before this option becomes available
*   Numeric
*   String
*   Geo
*   Temporal
*   Boolean
*   JSON
*   Link - building the relationships in the graph

10.  On the next tab, you can see the relationships in the graph, this will show links between objects. You can also set the document as a parent/child of another document.
11.  The final tab when creating the document shows it in its JSON format.
12.  Save your document by clicking on the disk icon.

Creating subdocuments and enums can be achieved in much the same way.

#### Schema as Code

![Develop a schema with code](https://assets.terminusdb.com/docs/schema-as-code.png)

Using a visual editor to build a schema isn’t for everybody. Users can also design schema as code.

1.  Choose Data Product Model from the lefthand menu - the second icon.
2.  In the window, there are two tabs, ‘Graph View’ and ‘JSON View’.
3.  Select JSON View.
4.  Click on the edit icon.
5.  Add or copy and paste the JSON schema into the window and save.

The schema should now display in the graph view.

## Version Control Features

TerminusDB has collaboration and version control features. Some of these are available via the dashboard. From the left select the first icon to navigate to your project home page -

![Manage your project](https://assets.terminusdb.com/docs/project-admin.png)

On this page, you can -

*   See a snapshot of the latest activities.
*   See the project details.
*   Clone the project - name it and decide which team you want to clone it to.
*   Delete the project.
*   Branch the project - along with reset and squash.
*   Time travel to any previous commit to inspect the project in the past.

![Time travel to a previous commit](https://assets.terminusdb.com/docs/time-travel2.png)

### Branch Projects

At the bottom of the project home page is the branch button.

![Branch the project](https://assets.terminusdb.com/docs/branch-project.png)

Each project can have one or more branches, the default is called main. Each branch contains a snapshot of the data as it was at the time of branching. This is useful for experimenting or providing data to other teams when you want to keep them away from main.

Users can reset a branch to a specific commit or can delete the commit history by squashing it. They do this by selecting the ellipsis symbol next to the branch and then following the prompts.

![Branch Options](https://assets.terminusdb.com/docs/branch-options.png)

### Reset Project

TerminusDB enables users to reset the project database to a particular commit. To do this, scroll to the bottom of the project home page and click branches.

Select the ellipsis symbol next to main. Here users can reset to a specific commit, or delete the commit history by squashing it.

![Reset the project](https://assets.terminusdb.com/docs/reset-to-commit.png)