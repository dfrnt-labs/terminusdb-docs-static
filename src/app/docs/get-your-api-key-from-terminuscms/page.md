---
nextjs:
  metadata:
    title: How to get your API key using the DFRNT TerminusDB cloud
    description: >-
      A how-to guide showing how to get your API key to set up and configure your
      environment to use with a client.
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/get-your-api-key.png
media: []
---

## Generate your API key

To use the Python or JavaScript client with TerminusDB, an API key is required. The API key is obtained in the DFRNT TerminusDB cloud by using the steps below.

**1\. Log in**

Log in to the modeller user interface [dfrnt.com](https://dfrnt.com)

**2\. Select a Team**

The teams are listed in the settings section after logging in (and selecting a plan if you have not already done so). This will be the team in which the API key will be generated.

**3\. Select your profile**

Select your `API Tokens` in the menu.

**4\. Generate a Personal Access Token**

Enter a description in `Add a Token Description` then click `Generate New Token`. Copy the token generated.

**5\. Copy the required code snippet**

Select the `Python` or `JavaScript` tab then copy the code snippet.

## Set up your environment

Assign your token to the environment variable `TERMINUSDB_ACCESS_TOKEN` in your code snippet. The example below is in `bash`.

### Code: API key environment configuration

```bash
export TERMINUSDB_ACCESS_TOKEN="my API key here"
```

You are now ready to start with a client -

[Connect to JavaScript Client](/docs/connect-with-the-javascript-client/)

[Connect to Python Client](/docs/connect-with-python-client/)