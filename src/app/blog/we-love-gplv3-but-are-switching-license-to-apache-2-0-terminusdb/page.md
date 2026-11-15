---
title: "We Love GPLv3, but are Switching License to Apache 2.0: TerminusDB"
date: 2021-02-03
nextjs:
  metadata:
    title: "We Love GPLv3, but are Switching License to Apache 2.0: TerminusDB"
    description: "We want software developers to embed TerminusDB in their applications & those developers feel that Apache 2.0 is a lower risk option"
    keywords: TerminusDB
    alternates:
      canonical: https://terminusdb.com/blog/we-love-gplv3-but-are-switching-license-to-apache-2-0-terminusdb/
    openGraph:
      type: article
      publishedTime: "2021-02-03T12:45:00+00:00"
      images: "https://terminusdb.com/images/blog/we-love-gplv3-but-are-switching-license-to-apache-2-0-terminusdb/apache-2.0-terminusdb.jpg"
media: []
---

> Author: Luke

## Changing License from GPLv3 to Apache 2.0: TerminusDB

We have decided to re-license TerminusDB from GPLv3 to Apache 2.0. We want independent software developers (ISVs) to embed TerminusDB in their applications and those developers feel that Apache 2.0 is a lower risk option. The substantive points of practical difference are far less important – sufficient people believe it to be true and sufficient lawyers have advised teams to be wary of GPLv3.

In our experience, ISVs and devs in large companies/institutions size up their options at project conception and there remains a niggling doubt that ‘GPL might limit commercial prospects and cause me headaches’. The world has changed – and code freedom is being overtaken by developer freedom.

Open-source software is everywhere. It’s eating the world. In the top 10 databases on [DB-Engines](https://db-engines.com/en/ranking), the remaining proprietary databases were released in 1980 (Oracle), 1983 (IBM Db2) and 1989 (Microsoft SQL Server). It is hard to imagine another non-OSS database ever entering the top 10.

We had hoped that our association with the principals of the free software movement would result in community adoption and contribution, but that hasn’t really been the case. We see limited community input that relates to our choice of GPLv3. That might not be too surprising as when you investigate which license to choose on Stackoverflow, you get popular but wrong-headed comments like:

> `the GNU/GPL bunch are generally extremists when you encounter them in the wild.`
>
> `don’t use GPL if you want your project to be commercial`

With the shift to Apache 2.0, TerminusDB is, in a sense, becoming more open source as we are removing restrictions on how you can use the software.

### The GPLv3 vs Apache 2.0 Debate

The core TerminusDB team had a long debate about licenses before the release of 1.0 last year. The main topics of discussion were:

1.  The risks of a cloud provider forking the code then hosting the database
2.  What open source means to TerminusDB as a group
3.  What we, as a community of devs and users, are most comfortable with

#### 1\. The big bad cloud providers

In the past there was an unwritten rule, that big platforms wouldn’t come along and fork open source code and deliver the same product as a service. Unfortunately, those days are gone. AWS in particular has actively sought to offer very similar services to open source products. This led to [MongoDB](https://www.mongodb.com/licensing/server-side-public-license/faq), [CockroachDB](https://www.cockroachlabs.com/blog/oss-relicensing-cockroachdb/) and [Confluent](https://www.confluent.io/confluent-community-license-faq/) (among others) changing their licences to variations of ‘server side’ and moving away from the open-source tradition. They try to say ‘we are still open source, we are just forbidding a specific type of action’, but it can feel like window dressing for ‘we want to sweat our assets’.

MongoDB, for example, is hardly suffering – it’s valued at over $15 billion. With such vast resources, they should be (and are) able to compete in the provision of their own database. MongoDB’s technology is more than competitive with AWS’ DocumentDB, and MongoDB’s Atlas DBaaS – which runs on AWS infra – has been a huge success.

I’m sure our perspective will shift over time, but from where we’re standing, having a cloud provider launch a competing service would be a sign of enormous success. (And this is not to say that the cloud providers’ parasitic approach to OSS projects is not a genuine problem, it simply acknowledges that you have to be a widely used OSS project before it \*becomes\* a problem).

### 2\. Free software

We don’t think it should be our job to provide corporations with free labor.

We do think that the software community should be able to access and use TerminusDB.

In 1974 software became copyrightable in the USA. It subsequently became obvious that researchers were giving out software for free, but businesses were not giving back. GNU/GPL came along to provide a new framework for that interface – the software would be free as in freedom (libre). Everybody would be free to modify and distribute, but proprietary additions would not be allowed.

The problem of businesses not giving back remains today.

GPL and copyleft provisions work well when they dominate open-source, but their waning popularity increases the ability for ISVs and corporates to go for more open licensing and for legal teams to write anti-GPL provisions into internal rules. Only significant developer push back can change that reality (and why push back when there are so many OSS options with permissive licenses).

Maybe if [MySQL](https://db-engines.com/en/system/MySQL), its offshoot [MariaDB](https://db-engines.com/en/system/MariaDB), and our graph brothers [Neo4j](https://db-engines.com/en/system/Neo4j) weren’t the only GPLv3 flag flyers in the top 20 databases, it might be easier to gain adoption with GPLv3; however, the other big OSS players: Postgres, Cassandra, Elastic, and Redis all go for less restrictive licenses.

The Affero GPL (AGPL) is treated as an even greater pariah than the GPLv3. The Google internal policy bans all use of AGPL:v3

![agpl at google](/images/blog/we-love-gplv3-but-are-switching-license-to-apache-2-0-terminusdb/agpl-at-google.jpg)

![agpl at google 2](/images/blog/we-love-gplv3-but-are-switching-license-to-apache-2-0-terminusdb/agpl-at-google-2.jpg)

It reminds of [this HN comment](https://news.ycombinator.com/item?id=13421608) on the [excellent postmortem](http://www.defmacro.org/2017/01/18/why-rethinkdb-failed.html) of the demise of RethinkDB (recommended reading for all OSS folk):

![agpl hn](/images/blog/we-love-gplv3-but-are-switching-license-to-apache-2-0-terminusdb/agpl-hn.jpg)

Our graph database brothers and sisters in [Neo4j moved](https://neo4j.com/open-core-and-neo4j/) from the AGPL to ‘AGPL with a commons clause’ to GPLv3 to making some of the code proprietary. Getting the right license for an OSS project that also allows for some commercialization is far from straightforward. (As Neo certainly knows – check out this [court case about the formerly GPL enterprise code](https://public.igovsol.com/neo4j-court-records/graphfoundation/80-main.pdf)).

It seems that [Grakn](https://github.com/graknlabs/grakn) and [Fluree](https://github.com/fluree/db) are seeing some success with the AGPL. We genuinely wish them well as we know it is a hard path to walk.

### 3\. Our community

We did get some negative feedback about GPLv3 prior to launch. Some people working in corporates weren’t comfortable and thought that it would prevent them from using TerminusDB. Our response was – **we didn’t develop for them**. And that remains the case; however, the GPL skeptical environment is pervasive. There is a person who tweets TerminusDB after every release asking when the Apache 2.0 version will land – I always ask him why he thinks he needs an Apache 2.0 version and he doesn’t really know… though he has a vague feeling that the application he builds on top will be less valuable.

### Why shift Licenses

We do not think that our job is to provide corporations with free labor.

We still believe that [“the fundamental act of friendship among programmers is the sharing of programs.”](https://www.gnu.org/gnu/manifesto.en.html)

We would welcome a GPL fork of the TerminusDB code – we are happy to work with any such project should it emerge.

But we wish to build a community first and foremost. In order to facilitate that community, we will be moving to Apache 2.0 immediately.

We are going to continue to focus on creating a great open-source multi-model database and allow everybody to use that software in their projects.
