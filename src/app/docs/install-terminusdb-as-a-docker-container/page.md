---
title: Install TerminusDB as a Docker Container
slug: install-terminusdb-as-a-docker-container
seo:
  title: Install TerminusDB as a Docker Container
  description: >-
    Everything you need to install and run TerminusDB server as a docker
    container on your computer or on a remote server
  og_image: >-
    https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media: []
---

> **Docker memory allocation on Windows**\\ On Windows, the default memory allocated for the Docker is **2GB**. TerminusDB is an in-memory database so it is advised to increase the allocation in Docker desktop settings. **Install TerminusDB on Windows with Docker Guide**
> 
> For a comprehensive guide to installing on Windows, our friends at DFRNT put this blog together - [Run TerminusDB on Windows with Docker](https://dfrnt.com/blog/2023-02-25-run-terminusdb-on-windows-with-docker/)
> 
> **Linux package manager**\\ On Linux, use your distro's package manager for containerized deployments or [find more information here](https://www.docker.com/products/container-runtime).

## Install steps

Install and run the TerminusDB container with the following steps.

*   [Clone the TerminusDB repo](#cloneterminusdb)
*   [Run the container](#runthecontainer)
*   [Use the console](#usetheconsole)

### Clone TerminusDB

`clone` the `terminusdb` repository and `cd` to it.

```bash
git clone https://github.com/terminusdb/terminusdb
```

```bash
cd terminusdb
```

### Run the container

Run the container using `docker compose`.

#### Running for the first time

First, set up a `.env` in the cloned directory with the following contents:

```bash
OPENAI_KEY=YOUR_OPENAI_KEY_HERE
# And optionally specify number of pages for the vector database
# for instance
BUFFER_AMOUNT=120000
```

The OPENAI\_KEY is not mandatory to use, but without it, the AI indexing will not work. Of course, all the document graph database functionality will still work as intended.

Run the container with the command `docker compose up`. See [Environment configuration](#environmentconfiguration) for further configuration options.

```bash
docker compose up
```

This generates the message: `terminusdb-server container started http://127.0.0.1:6363/`. This is the TerminusDB Server and [Console](#usetheconsole) URL.

#### Subsequent runs

*   Remove previous volumes. Enter `y` to confirm removal when prompted.
*   Rerun the container.

> **Warning:** Removing previous volumes will erase local data.

```bash
docker compose rm
docker compose run
```

### Use the console

Open the TerminusDB console in a web browser using the URL.

```bash
http://127.0.0.1:6363/dashboard
```

### Use the Dashboard

The TerminusDB local dashboard is included within TerminusDB. The dashboard is a UI to create and manage data products, model data, and test queries. To use the dashboard visit:

```bash
http://127.0.0.1:6363/dashboard/
```

### Use GraphQL

TerminusDB hosts a GraphQL endpoint at:

```bash
SERVERNAME/api/graphql/ORG/DATAPRODUCT
```

For instance, with a data product named `admin/people`, and a locally installed TerminusDB, you can query it at:

```bash
http://127.0.0.1:6363/api/graphql/admin/people
```

TerminusDB ships with a GraphiQL graphical GraphQL query interface and schema browser. This is a quick way to get acquainted with GraphQL in TerminusDB.

You can reach this browser at:

```bash
http://127.0.0.1:6363/api/graphiql/admin/people
```

## Environment configuration

The container uses a set of environment variables with default values. You can configure the environment by setting these variables. You can set additional ENV variables or override already set ones by creating a `.env` file.

## Migrating from terminusdb-bootstrap

In order to migrate from the default terminusdb-bootstrap installation while stil keeping the data of your previous installation, run the docker compose commands the following way:

```bash
docker compose -f docker-compose.yml -f distribution/docker-compose/bootstrap_storage.yaml
```

For instance, for the `up` command to start the server, run:

```bash
docker compose -f docker-compose.yml -f distribution/docker-compose/bootstrap_storage.yaml up
```

## Using the CLI

To access the TerminusDB CLI from the Docker Compose, run:

```bash
docker compose run terminusdb-server ./terminusdb
```

Or use `exec` when you have the service already running

## Server deployment

> The TerminusDB server is deployed to your computer by default.

### Local computer deployment

By default, the Docker container binds to IP `127.0.0.1`. This prevents insecure deployments and ensures the TerminusDB server is accessible on a local computer only.

### Remote server deployment

To deploy the TerminusDB server to a remote machine:

*   Enable HTTPS with a remote proxy like Nginx
*   Don't use the `X-Forward-Header` ENV variables unless you really know what you are doing