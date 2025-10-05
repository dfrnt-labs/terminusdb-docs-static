---
title: "JSON Diff and Patch: TerminusDB Patch Endpoint"
nextjs:
  metadata:
    title: "JSON Diff and Patch: TerminusDB Patch Endpoint"
    description: "JSON Diff and Patch reference guide to apply a patch to a provided document or document in a repository."
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
    alternates:
      canonical: https://terminusdb.org/docs/patch-endpoint/
media: []
---

The diff and patch functionality has a diff endpoint and a patch endpoint. The patch 


I checked the source code for the client driver, and you would supply `{ patch, author, message }` to the endpoint and patch is an array of patch with `@id` set. 

Patch (with a before document):
https://terminusdb.org/docs/javascript/#patchbeforepatch

PatchResource (patch a resource):
https://terminusdb.org/docs/javascript/#patchresourcepatchmessage

The patch endpoint is used differently, with a before document and a patch, you apply a patch without id to a specific before document:`{before, patch}` (javascript syntax).

With the patch endpoint for a resource, you supply a list of patched with the `@id` field added to the patch. Unsure if you can patch multiple documents by supplying an array for the `@id` field, but can be worth trying if relevant to your use case. 

## Patching a terminusdb resource

```json
[
  {
   "@id": "Obj/id1",
    "name": {
     "@op": "SwapValue",
      "@before": "foo",
      "@after": "bar"
    }
  },
 {
   "@id": "Obj/id2",
    "name": {
      "@op": "SwapValue",
      "@before": "foo",
     "@after": "bar"
    }
 }
]
```

```javascript
client.db("mydb")
client.checkout("mybranch")
client.patchResource(patch,"apply patch to mybranch").then(patchResult=>{
 console.log(patchResult)
})
// result example
// ["Obj/id1",
// "Obj/id2"]
// or conflict error 409
// {
// "@type": "api:PatchError",
// "api:status": "api:conflict",
// "api:witnesses": [
//  {
//   "@op": "InsertConflict",
//    "@id_already_exists": "Person/Jane"
//  }
//]
//}