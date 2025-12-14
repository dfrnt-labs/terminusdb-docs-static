---
title: Start Here with TerminusDB
nextjs:
  metadata:
    title: Git-for-Data Document Graph Infrastructure - TerminusDB Documentation
    description: Choose your path to get started with TerminusDB. Whether you're a developer, data engineer, or evaluator, find the resources you need.
    alternates:
      canonical: https://terminusdb.org/docs/start-here/
---

{% hero-section 
   title="Git-for-Data Document Graph Infrastructure" 
   subtitle="The graph database that combines documents, version control, and collaboration. Choose your path to get started." /%}

## Choose Your Path

Select the role that best describes you to see relevant documentation and resources.

{% quick-links %}

{% quick-link 
   title="Application Developer" 
   description="Build applications with TerminusDB's GraphQL API and client libraries. Get started with JavaScript or Python clients."
   icon="installation"
   href="/docs/get-started" /%}

{% quick-link 
   title="Knowledge Engineer" 
   description="Design schemas, import data, and manage collaborative workflows with Git-for-Data version control."
   icon="plugins"
   href="/docs/documents-explanation/" /%}

{% quick-link 
   title="Solution Evaluator" 
   description="Understand TerminusDB's unique features, architecture, and how it compares to other databases."
   icon="lightbulb"
   href="/docs/terminusdb-explanation" /%}

{% quick-link 
   title="Business Analyst" 
   description="Learn about the RDF Graph Documents API and Git-for-Data features for content management and analytics."
   icon="presets"
   href="/docs/documents-explanation" /%}

{% /quick-links %}

## Why TerminusDB?

Unique features that set TerminusDB apart from other databases.

{% feature-grid %}

{% feature-highlight 
   title="Git-for-Data" 
   description="Branch, merge, and time-travel through your data with full version control built into the database."
   href="/docs/git-for-data-reference"
   badge="Unique"
   shimmer=true /%}

{% feature-highlight 
   title="GraphQL Native" 
   description="Auto-generated GraphQL APIs from your schema. No resolvers, no boilerplate code required."
   href="/docs/how-to-query-with-graphql" /%}

{% feature-highlight 
   title="Document + Graph" 
   description="Store hierarchical JSON documents and navigate them as an RDF graph linked data. Best of all worlds."
   href="/docs/documents-explanation" /%}

{% feature-highlight 
   title="WOQL (Datalog)" 
   description="Powerful logic-based queries with unification and pattern matching for complex graph traversals."
   href="/docs/what-is-datalog" /%}

{% feature-highlight 
   title="Schema Validation" 
   description="Strong typing with flexible schema evolution. Validate data integrity without sacrificing agility."
   href="/docs/schema-reference-guide" /%}

{% feature-highlight 
   title="Open Source" 
   description="Apache 2.0 licensed. Deploy anywhere: Docker, Kubernetes, or use DFRNT Cloud hosting."
   href="https://github.com/terminusdb/terminusdb" /%}

{% /feature-grid %}

## Ready to Get Started?

Sign up for DFRNT Cloud and get a fully managed TerminusDB instance with a powerful UI, or run it locally with Docker.

{% cta-buttons 
   primaryText="Start in Cloud"
   primaryHref="https://dfrnt.com/sign-up"
   secondaryText="Start with Docker"
   secondaryHref="/docs/get-started/" /%}

## Browse by Topic

{% topic-grid %}

{% topic-card 
   title="Getting Started"
   description="Quickstart guides and tutorials"
   href="/docs/get-started" /%}

{% topic-card 
   title="Query Languages"
   description="GraphQL and WOQL guides"
   href="/docs/how-to-query-with-graphql" /%}

{% topic-card 
   title="Client SDKs"
   description="JavaScript, Python, and REST"
   href="/docs/use-the-clients" /%}

{% topic-card 
   title="Reference"
   description="Schema, API, and CLI docs"
   href="/docs/schema-reference-guide" /%}

{% /topic-grid %}
