---
title: "Were we wrong about Web3?"
date: 2022-03-29
nextjs:
  metadata:
    title: "Were we wrong about Web3?"
    description: "Web3. Don't shoot! This article looks at our discussions about Web3 and takes stock of the detractors and tries to find a healthy balance."
    keywords: TerminusDB
    alternates:
      canonical: https://terminusdb.com/blog/were-we-wrong-about-web3/
    openGraph:
      type: article
      publishedTime: "2022-03-29T11:18:32+00:00"
      images: "https://terminusdb.com/images/blog/were-we-wrong-about-web3/were-we-wrong-about-web3.png"
media: []
---

> Author: Luke

This is a narrative about our dialectical struggle between Web3 and Not-Web3. We’d like to find a Web3 synthesis; however, we’re not sure that we will.

> Git is the most successful Web3 project.
>
> — Kelsey Hightower (@kelseyhightower) [February 15, 2022](https://twitter.com/kelseyhightower/status/1493710478341595136?ref_src=twsrc%5Etfw)

Git is the most successful Web3 project.

The tweet that launched a thousand [TerminusDB](https://github.com/terminusdb/terminusdb) debates.

If git is the most successful Web3 project, and TerminusDB is ‘[git for data](/blog/git-for-data/)’ then we must be Web3, right? *[Socrates is a man](https://en.wikipedia.org/wiki/Syllogism) and all that*. But isn’t Web3 about blockchain and crypto? Certainly, every hacker site that I visit has an article attacking web3, but *usually* just as a proxy for attacking blockchain. And that I get. Blockchain is too slow for data.

## We are git for data, so are we web3?

While blockchain is too slow for software, immutable – or append-only – data stores are great. Or at least I think so. Web3 This is obviously something that revision control [distributed databases](/blog/distributed-database-with-collaboration-model/) with git-like qualities, so I asked the author of the [definitive blog](https://www.dolthub.com/blog/2021-09-17-database-version-control/) on version-controlled databases. Tim from [Dolt](https://github.com/dolthub/dolt) said:

> If we’re extending the definition of web3 to include decentralized software systems, Version controlled databases, like Terminus and Dolt, must be included.
>
> Tim Sehn [Tweet](https://twitter.com/intent/tweet?text=If+we%E2%80%99re+extending+the+definition+of+web3+to+include+decentralized+software+systems%2C+Version+controlled+databases%2C+like+Terminus+and+Dolt%2C+must+be+included.++%E2%80%94+Tim+Sehn&url=https%3A%2F%2Fterminusdb.com%2Fblog%2Fwere-we-wrong-about-web3%2F)

But maybe I am just projecting my own image – or the image of [TerminusDB](/) – on web3? Like Narcissus, am I falling in love with my own reflection?

We spent the late part of last year batting some Web3 ideas back and forth, but mostly in the context of pitching to VCs. Here is an email that Gavin sent to me:

```markup

					# Web3

If the rumours we've heard are correct, web3 is a buzz-word for VC froth at the moment.

We aren't so far away from web3 at the minute anyhow, so if so, this would be good. What constitutes web3?

* Verifiable
* Trustless
* Self-governing
* Permissionless
* Distributed and robust
* Stateful
* Native built-in payments

The first two have been road map for a long time, but we've never gotten enough interest from *users* to front it.

We are "self-governing" in the sense of being multi-master. We have an auth based capability model, so "permissionless" in a web3 sense. We are distributed, robust and stateful.

The last of these doesn't exist - although we've thought about it. We could probably pitch to web3 given the current coverage, with the outstanding parts as roadmap.

```

We need money to grow the project and there has been a lot of energy (and funding) in web3 projects. But in that description you get a feeling for what we see as web3. A lot of contrarian hacker commentary suggests that web 2.0 gave us centralized services because that is what we want. People – in this anthropology of the internet – aren’t like network engineers with their love of distributed systems, they want Facebook to see their pals and google to do the rest. In this model, people don’t want to spend time setting up their own shit and just want to use what is there at whatever price. That’s true – but it also describes the failure of distributed systems in web 2.0 – people don’t want to set up their own shit AND they don’t want megacorps controlling their digital lives. Our vision of web3 has both.

To return to the debate narrative, we then mentioned Web3 in this [JSON Diff and Patch article](/blog/json-diff-and-patch-the-future/) that was briefly on the [front page of Hacker News](https://news.ycombinator.com/item?id=30362025)

And even though the article wasn’t about web3, that’s where the push back came in the comments. People are *literally* offended by the word.

> web3 oh no.
>
> Hacker News Naysayer

And then the plot thickened…one of our engineers wrote in support of the naysayers in our Discord:

```markup

					Hmmm lots of replies on hacker news about the web3 part. To be honest, I'm also a bit allergic to those words.
  😄 But perhaps controversy is also good marketing? I don't know

```

In general the whole thing feels a bit like this type of debate:

[![Web3 conflict](/images/blog/were-we-wrong-about-web3/web3-conflict.jpg)](https://www.tomgauld.com/)

*Wonderful work of cartoonist Tom Gauld*

Snarky, snobby engineers who see themselves as the holders of development truth.

Vs

Those crypto-bro NFT grifters moronically engaging in a pyramid scheme.

The conversation moved into our community and most supported the anti-Web3 vibe.

> I share the other posters reaction 🤣 web3 oh no. for the love of all that is holy, don't go there

This was followed with some faint praise

> we know that you make cool stuff, but only mentioning web3 in a serious tone is setting all my bullshit spider senses 🕸️🕸️🕸️

And (which is funny as we would – of course – like funding from any crypto whales out there)

> It is, in my experience, unless you're out for funding from some crypto whales, I wouldn't touch it with a ten foot pole. NFTs were the death knell to the whole thing, bitcoins absurdity brought to a level indistinguishable from satire

I then suggested that we should try to rebrand Web3 and ‘[Semantic Web](/blog/the-semantic-web-is-dead/)3′ to take advantage of our varied strengths. This was – the admittedly hilarious – response:

> to get both the connotation of failed enterprise technology and scammy hipster tech?

After that, the TerminusDB team – and especially the pro Web3 crew – were a little chastened and thought that we should just go slow on the Web3 talk while continuing to build quality software that hackers and devs want to use. Devs are our people and we don’t want to alienate them with spoofy ideas.

🎼🎼🎼🎼

But then somebody came into [our community](https://discord.gg/thy2NQwXbc) with a really interesting Web3 (!) idea.

It is called [*Parture*](https://parture.org/) and they are on a mission to transcribe all music *ever* recorded

They are developing a permissionless public blockchain protocol to transcribe all music, make it available for academia, copyright dispute settlement, developers and musicians all over the world.

They landed in TerminusDB and said

```markup

					it seems to be the only db to do what I want, which is immutable graph DB, with branching, AND query!

```

What is not to like!

The vision for Parture is a [DAO-layer](https://en.wikipedia.org/wiki/Decentralized_autonomous_organization) that manages the catalog and is tasked with linking the best, most accurate sheet music versions (data hashes) to the official artist/album entries. Once sheet music data is accepted as the main official link to a track in the catalog, every contributor gets an NFT equal to the size of the contribution. This is why every version, every edit and all the history of every score edited on the platform needs to be kept. The NFT is tradeable and generates fees from API use.

So every time you generate a karaoke backing track for a new song, you pay a small fee, and that fee is distributed to every contributor that worked on that particular score likewise, when you search the platform using the API, saying “give me all tracks that are both similar to Beethoven AND Franz Ferdinand, in the key of C but not longer than 30 measures”, the fee you pay for the query is distributed over all share owners (contributors) of all scores that come up as a search result.

Great idea – distributed, approval pipeline, data merge, self-governing… all of Terminus’ (and Web3’s) highlights.

After this, I thought I should have another attempt to convince the team and said

> i think we need to start looking at 'baby not bathwater' web3 content for the site & blog we should have a discussion, but i think we should wet our beaks at least

(baby not bathwater is in reference to a line I have been propagating about not throwing the distributed, decentralized baby out with the NFT bathwater)

Which was met with…

> I'm not part of marketing so it is obvious not my thing to decide but as a developer I get the chills every time I read Web 3.0. If a project contains this sort of text it immediately puts me off and I would really have to be convinced that it is a good thing before I look at it again. 😄 I think the majority of devs are like this and only a tiny amount of cryptocurrency enthusiasts like the whole idea of Web 3.0. I would be a little bit reluctant about riding the hype train as I remember that the "AI Code generation" thing was also badly received and puts people off.

‘AI Code Generation’ is a reference to a much-mocked feature that we used to list on our website. We have a patented [method of facilitating the construction of a user interface](https://patents.google.com/patent/US11238059B2/en) from a data model, which – if you squint and twist your head to 90 degrees – could be AI Code Generation, but you can understand why people weren’t comfortable with this and other elements of the comparison table.

[![AI Code generation](/images/blog/were-we-wrong-about-web3/aicodegeneration.png)](/images/blog/were-we-wrong-about-web3/aicodegeneration.png)

My answer:

> think it divides people - some developers, like the chap in our community, are super excited by the ideas in web3. What we are building, especially if we go deeper on merge and push/pull, is very web3, so we have to own that as an idea set. putting people off isn't a bad thing - we want to put off the people that aren't going to invest time in building and being too generic is bad for separating out the groups

I then become fairly (self) righteous in my responses:

> if we define what it is for us then we can refer back to that on the broader point, there is no way to address the project to the majority of devs. We need to address devs that will actually use our software. If we remain too general, then people don't know why they should bother. At the moment our general, technical descriptions aren't hitting home to get a sufficient number of new users. i don't think decentralized, distributed, trust free, permissionless, stateful applications are hype - i think they are valuable and we should explain to people why they are valuable if the ideas around web3 get rejected, so do our core ideas if we can't separate out the valuable from the useless, nobody else will do it for us

## My basic thesis: the hype is the problem, not the ideas

So we put it to a vote… and it turns out that we are divided both on LinkedIn

![Web3 LinkedIn vote](/images/blog/were-we-wrong-about-web3/web3-linkedinvote.jpg)

And on the more free flowing Twitter:

![Web3 twitter vote](/images/blog/were-we-wrong-about-web3/web3-twittervote.jpg)

So we come to the end of this part of our discovery no more enlightened than we started. Is Web3 just about the grifters and the blockchainies? Or is Web3 a better tomorrow and something worth striving for?

What we want is:

-   Decentralized web and application infrastructure
-   Ownership of data, content, and platforms
-   Distributed, trustless, & robust infrastructure
-   Open, public, composable back ends

If we also get:

-   Native digital payments
-   Self-sovereign identity

Then that is also fine. What we don’t want is loads of grifters in pump and dump shitcoins and pompous VCs getting rich. We also don’t want slow applications that are built on the chain.

Is there a happy medium, can we keep the good and cast out the bad? Can we build a better tomorrow?

Couldn’t finish without pointing out the worst take of them all. Do people have no shame?

> Everyone Tweeting incessantly about "web 3.0" has outsourced their critical thinking. Like, replace web 3 with communism and imagine its 1950. Communism is clearly the future.
>
> — Adam Singer (@AdamSinger) [September 17, 2021](https://twitter.com/AdamSinger/status/1438983650314489857?ref_src=twsrc%5Etfw)
