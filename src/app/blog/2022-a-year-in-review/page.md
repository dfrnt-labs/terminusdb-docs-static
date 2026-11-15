---
title: "2022 - A Year in Review | A TerminusDB Retrospective"
date: 2022-12-20
nextjs:
  metadata:
    title: "2022 - A Year in Review | A TerminusDB Retrospective"
    description: "We take a look at all that has happened at TerminusDB towers in the past 12 months in this 2022, a year-in-review retrospective."
    keywords: TerminusDB
    alternates:
      canonical: https://terminusdb.com/blog/2022-a-year-in-review/
    openGraph:
      type: article
      publishedTime: "2022-12-20T14:01:55+00:00"
      images: "https://terminusdb.com/images/blog/2022-a-year-in-review/a-year-in-review-feature.jpg"
media: []
---

> Author: Sreya

This year has gone by so fast. I know, I know, we say that EVERY year, and yet every year it’s true that the year in question really seems to have gone by a lot faster than the previous years. So much has happened in 2022, and there is so much to look forward to in 2023. However, all too often, we can get caught up in the rush of life and all the plans we have for the future, so much so that we lose track of just how far we have already come. 

As a tech start-up, we are almost always iterating, pushing out new features, and working on new products and services. TerminusDB has exciting plans for next year, but we are going to take a little moment to look back at all that’s happened in 2022. What better time to do a retrospective than at the end of the year, right? Here’s what happened, ICYMI: 

## Community and Collaboration

The Terminator community is now 674 people strong! From modest beginnings to now nearly 700 people. We are delighted to be able to share this journey with you and look forward to more growth and success. As always, we are grateful for the feedback and welcome all questions. If you’re new to TerminusDB and haven’t joined our Discord community yet, you can do so [here](https://discord.com/invite/Gvdqw97). It’s a great space to chat all things TerminusDB. It’s also a great space for discussions on all things data and databases, so if that’s your vibe, we’re your tribe. 

As a result of our growing community and of being open source, we’ve been fortunate to have made friends that we have been able to collaborate with over the years. One of those projects has been on DFRNT with Philippe Hoij. If we’re being perfectly honest, this collaboration started in 2021, but has really come into full force and fruition this year. DFRNT is a SaaS platform that enables visual graph data collaboration while leveraging TerminusDB. DFRNT provides graph data product hosting, visualization and modeling, with data product hosting maintained by us over at TerminusDB. You can find out more [here](https://dfrnt.com/).

Also this year, community member, Fidel Thomet, demonstrated how TerminusDB is being used as a collaborative research database to support the [Amazonia Future Lab](https://uclab.fh-potsdam.de/projects/amazonia-future-lab/) project.

[![How TerminusDB is being used as an academic collaborative research database](/images/blog/2022-a-year-in-review/Amazonia-Future-Lab-research-database.jpg)](/blog/collaborative-research-database/)

[**How TerminusDB is being used as an academic collaborative research database**](/blog/collaborative-research-database/) — See how TerminusDB is used as an academic research database by Amazonia Future Lab to connect collections & local knowledge.

The purpose of the project is to derive knowledge from indigenous communities and collections spread across various cultural institutions. Collaborative working is at the very heart of the project and is essential to understand how certain artifacts were used, to create new interpretations of cultural heritage, and improve the representation of indigenous perspectives. The connected knowledge will be publicly accessible via interactive formats to explore and contribute to. The tools created will be made freely available to be used or further developed by other communities and institutions that are engaged in the field of participatory cultural education.

To see how you might be able to use TerminusDB for a project of your own, have a look at our [use cases](/use-cases/), or [get in touch](/contact/) with us.

## Climate Action

In July 2021, TerminusDB received an interesting email. It was to chat about how TerminusDB might be able to help with the development of a critical asset management tool to help governments be better prepared for disaster management and resilience in the face of climate change. After months of conversation with key stakeholders, and some furious development on our part, the CAMS MVP was launched, with a Spanish version of the tool made available shortly thereafter. CAMS is a critical asset management system developed as part of a voluntary effort, led by ARISE-US, a private-sector advisory group to the United Nations Office for Disaster Risk Reduction (UNDRR), and TerminusDB.

[![TerminusDB to make Caribbean island more disaster-resilient with Critical Asset Management System](/images/blog/2022-a-year-in-review/critical-asset-management-system-header-300x158.png)](/blog/critical-asset-management-system/)

[**TerminusDB to make Caribbean island more disaster-resilient with Critical Asset Management System**](/blog/critical-asset-management-system/) — TerminusDB to help Caribbean Island become disaster-resilient with Critical Asset Management System A critical asset management system is being developed as part of a voluntary

The project is open source and focused on providing a data-driven system to help islands, cities, and communities become disaster resilient. It does this by storing all critical asset data and the asset dependencies. CAMS is a data-driven mobile and desktop application. Government officials and first responders use it to plan and respond to disasters. Learn more about the project [here](https://climateresilient.world/), and see how you can contribute. 

## Compliance

![TerminusDB SOC2](/images/blog/2022-a-year-in-review/dobby-soc2.jpg)

We achieved SOC 2 compliance! While some of our team are still somewhat recovering from the trauma, we did it all for you! The SOC 2 compliance certification is the most widely recognized method for sharing independently reviewed information about a service organization’s internal controls. The accreditation means that TerminusDB and TerminusX meet or exceed the levels of security required for service providers storing customer data in the cloud.

While we have always taken data security and privacy very seriously – we are after all, a database company – having SOC 2 certification lets us demonstrate to new and existing customers these matters are a priority to us.

## New Features and New Releases

There have been plenty of new features, along with a few releases this year.

#### TerminusDB CLI

If you’re signed up for our newsletters, you’d have received some updates on the TerminusDB CLI for Push / Pull / Clone. TerminusDB is designed to be a [distributed database](/blog/distributed-database-with-collaboration-model/) with a collaboration model. The building blocks of that model are revision control, diff, and push/pull/clone. It is essentially meant to be like Git, but for data. The foundation of a distributed database with a collaboration model are Revision Control, Diff, and Push/Pull/Clone. Read more about the TerminusDB CLI, and the building blocks of a distributed database with a collaboration model [here](/blog/distributed-database-with-collaboration-model/).

#### TerminusDB 10.1: The Mule

We had a need for speed, so we released TerminusDB 10.1, which demonstrated significant improvements to the speed and performance of the document interface, including much improved WOQL integration.The Mule Release – a homage to Asimov’s Foundation series, of course – was faster, more robust, and packed with new features to make building knowledge graphs and data-intensive applications easier and quicker. Some of the noteworthy elements in the new release were:

-   Type inference
-   Unconstrained and untypechecked JSON documents and subdocuments
-   ID capture
-   Document UI SDK
-   JSON Diff & Patch
-   Applying a patch from any two commits

The release also included improvements to the CLI, Oauth2 configuration for SSO, and more features you can read more in detail about [here](/blog/the-mule-release/).

#### More Speed with TerminusDB 10.1.5

This version of TerminusDB included some significant performance improvements, including a 10x speedup of document retrieval and a 10x improvement in insertion speed. More details can be found [here](/blog/terminusdb-10-1-5-release/).

#### GraphQL is here

This is something that we’ve been working on for the better part of this year, and we were excited to announce that it finally happened. The latest TerminusDB release came with GraphQL to further improve the developer experience. Your data product schemas are automatically loaded in GraphQL for speed and convenience. GraphQL means you can now use most programming languages to work with TerminusDB. This release was a big step toward TerminusDB becoming a headless CMS and managing content in a knowledge graph. You can read more about our plans for [headless CMS here](/blog/terminusdb-a-headless-cms/).

## Company and Celebrations

Over the course of the pandemic, we became rather good at throwing virtual parties and celebrations – all complete with themed quizzes created by the ultimate quiz master, i.e., me.

Jokes aside, 2022 was the first time in a long time we all finally got together in person for a week’s worth of planning – in beautiful Vienna to boot! Many of the new features and developments you’ve been seeing over the course of the year have been a result of all we discussed during that week’s worth of planning. We had an internal retrospective recently, as part of one of our discovery sessions, and almost everything we had planned in Vienna has been implemented.

![TerminusDB in Vienna](/images/blog/2022-a-year-in-review/terminusdb-in-vienna.jpg)

As per usual, we focused all too much on all the things that are yet to be done and all the plans we have for the future. Still, I think we should be very proud of what we’ve accomplished this year. I, personally, am always in awe of our team. We are small in number, but strong in might. We ended this year of work with a lovely (virtual) Christmas party, and would like to take this opportunity to wish all of you who are along on this ride with us a very Happy Christmas and a joyous New Year.

See you in 2023 with lots more exciting stuff coming your way.

![Happy Christmas from TerminusDB](/images/blog/2022-a-year-in-review/og-socials-merry-christmas-from-TerminusDB-2022.jpg)
