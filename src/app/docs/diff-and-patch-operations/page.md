---
title: Diff an Object or a Database Branch with the JS Client
nextjs:
  metadata:
    title: Diff an Object or a Database Branch with the JS Client
    description: A guide to show how to use the JS Client to diff an object or a database branch.
    openGraph:
      images: https://github.com/terminusdb/terminusdb-web-assets/blob/master/docs/js-client-collaboration-diff-patch.png?raw=true
    alternates:
      canonical: https://terminusdb.org/docs/diff-and-patch-operations/
media: []
---

## Diff an object

Return the diff from two objects

```javascript
const diffObjects = async () => {
   const before = { "@id" : "Person/Jane", "@type" : "Person", "name" : "Jane"}
   const after = { "@id" : "Person/Jane", "@type" : "Person", "name" : "Janine"}
   const options = {keep:{ "@id" : true, "name" : true }}

   //in the options you can list the properties that you would like to see in the diff result.
   const diffResult = await client.getJSONDiff = function (before, after, options) {

   console.log("the diff result ", JSON.stringify(diffResult,null,4))
}
```

Here is an example of a diff result between two objects

```json
{
   "name":{
      "@op":"ValueSwap",
      "@before":"Jane",
      "@after":"Janine"
   },
   "@id":"Person/Jane"
}
```

## Get the patch of differences between branches or commits.

```javascript
const diffDocsVersion = async () => {
   const beforeVersion = "a73ssscfx0kke7z76083cgswszdxy6l"
   const afterVersion =  "73rqpooz65kbsheuno5dsayh71x7wf4"
   const options = {keep:{ "@id" : true, "name" : true }}

   const diffResult = await client.getVersionDiff = function (beforeVersion, afterVersion, null, options) {

   console.log("the diff result ", JSON.stringify(diffResult,null,4))
}
```

Here is the example result

```json
[
   {
      "@id":"Person/Jane",
      "@type":"Person",
      "name" : "Jane"
      "age":{
         "@after":23,
         "@before":22,
         "@op":"SwapValue"
      }
   },
   {
      "@id":"Person/Tom",
      "@type":"Person",
      "name" : "Tom"
      "age":{
         "@after":10,
         "@before":null,
         "@op":"SwapValue"
      }
   }
]
```

## Get the patch of difference between a document and an object.

```javascript
const diffDocToObject = async () => {
   const jsonObject = { "@id" : "Person/Jane", "@type" : "Person", "name" : "Jannet"}
   const options = {keep:{ "@id" : true, "name" : true }}

   //in the options you can list the properties that you would like to see in the diff result.
   const diffResult = await client.getVersionObjectDiff = function ("main", jsonObject, "Person/Jane", options) {

   console.log("the diff result ", JSON.stringify(diffResult,null,4))
}
```