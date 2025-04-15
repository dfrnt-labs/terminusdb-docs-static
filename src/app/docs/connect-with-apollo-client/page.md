---
nextjs:
  metadata:
    title: Connect with Apollo Client to use GraphQL with TerminusDB
    description: >-
      A reference guide to get you up and running with TerminusDB & TerminusDB 
      using GraphQL and Apollo Client
    openGraph:
      images: >-
        https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media: []
---

1.  Install dependencies

```bash
npm install @apollo/client graphql
```

2.  Initialize ApolloClient and Connect with TerminusDB

Import the required dependencies needed -

```python
import { ApolloClient, InMemoryCache, ApolloProvider, gql,HttpLink,ApolloLink } from '@apollo/client';
```

Or

```javascript
const Apollo =  require( '@apollo/client');

const { ApolloClient, InMemoryCache, concat, gql,HttpLink,ApolloLink } = Apollo
```

Initialize ApolloClient by passing its constructor with a configuration object with the TerminusDB server endpoint, user credentials and cache fields.

> Extra information about the Apollo client cache can be found on their [website](https://www.apollographql.com/docs/react/caching/overview)

## Connect with TerminusDB Local

```javascript
const orgName = "myOrganizationName"
const dbName = "myDBname"
const myBranch = "main"

const user = "admin"
const password = "mypass"
const userPassEnc = btoa(`${user}:${password}`)

const terminusdbURL = `http://127.0.0.1:6363/api/graphql/${orgName}/${dbName}/local/branch/${myBranch}/`

const httpLink = new HttpLink({ uri: terminusdbURL });
const authMiddleware = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    operation.setContext(({ headers = {} }) => ({
    headers: {
        ...headers,
        authorization: `Basic ${userPassEnc}`}
    }));
    return forward(operation);
})

const cache = new InMemoryCache({
    addTypename: false
});

const value = concat(authMiddleware, httpLink)

const apolloClient = new ApolloClient({
    cache:cache,
    link: value,       
});

// Query your database

apolloClient
  .query({
    query: gql`
     query{
        Person{
        _id
        name
        }
    }
    `,
  })
  .then((result) => console.log(result.data))
  .catch(err =>console.log(err.message));
```

## Connect with DFRNT TerminusDB cloud

> You will need to [get your API key](/docs/how-to-connect-terminuscms/) to connect with DFRNT TerminusDB cloud

```javascript
const orgName = "myOrganizationName"
const dbName = "myDBname"
const myBranch = "main"

const myAPIToken = 'replaceYourToken'

const terminusdbURL = `https://dfrnt.com/api/hosted/${orgName}/api/graphql/${orgName}/${dbName}/local/branch/${myBranch}/`

const httpLink = new HttpLink({ uri: terminusdbURL });
const authMiddleware = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    operation.setContext(({ headers = {} }) => ({
    headers: {
        ...headers,
        authorization: `Token ${myAPIToken}`}
    }));
    return forward(operation);
})

const cache = new InMemoryCache({
    addTypename: false
});

const value = concat(authMiddleware, httpLink)

const apolloClient = new ApolloClient({
    cache:cache,
    link: value,       
});

// Query your database

apolloClient
  .query({
    query: gql`
     query{
        Person{
        _id
        name
        }
    }
    `,
  })
  .then((result) => console.log(result.data))
  .catch(err =>console.log(err.message));
```