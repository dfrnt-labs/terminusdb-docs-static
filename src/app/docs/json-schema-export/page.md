---
title: JSON Schema Export
nextjs:
  metadata:
    title: JSON Schema Export — TerminusDB
    description: Export JSON Schema draft-07 documents for TerminusDB classes — one class or the whole database — and scaffold TypeScript typings from the generated schema.
    keywords: terminusdb, json schema, draft-07, typescript typings, schema export, getJSONSchema, get_json_schema, class schema, rjsf, react-jsonschema-form, generated forms
    alternates:
      canonical: https://terminusdb.com/docs/json-schema-export/
    openGraph:
      images: https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
tags:
  - schema
  - typescript
  - python
  - curl
  - how-to
---

{% callout type="note" %}
**Prerequisites**
- TerminusDB running locally ([install guide](/docs/install-terminusdb-as-a-docker-container/))
- A database with a schema ([schema reference](/docs/schema-reference-guide/))
{% /callout %}

TerminusDB generates a [JSON Schema draft-07](https://json-schema.org/draft-07/schema) document from any class definition on the server side. You ask for a class — or the whole database — and get back a schema that validates instances of that class, drives generated UIs, and seeds generated typings. The server does the conversion, so every client sees the same document and nothing has to be maintained twice.

The export lives on the schema endpoint under `format=jsonschema`. Both official clients expose it as a single call.

## Get the JSON Schema for a class

{% code-tabs %}
{% code-tab label="TypeScript" %}
```typescript
const schema = await client.getJSONSchema("Person")
```
{% /code-tab %}
{% code-tab label="Python" %}
```python
schema = client.get_json_schema("Person")
```
{% /code-tab %}
{% code-tab label="HTTP (curl)" %}
```bash
curl -u admin:root \
  "http://localhost:6363/api/schema/admin/MyDatabase/local/branch/main?type=Person&format=jsonschema"
```
{% /code-tab %}
{% /code-tabs %}

For a class `Person` with a mandatory `name` property, the response is:

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "@id": { "type": "string" },
    "@type": { "type": "string" },
    "name": { "type": "string" }
  },
  "required": ["name"],
  "additionalProperties": false,
  "x-terminusdb": {
    "id_pattern": "^Person/[A-Za-zÀ-῿Ⰰ-�0-9\\-_.!?%()]+$",
    "type_choices": ["Person"]
  }
}
```

## Get the JSON Schema for the whole database

Omit the class name and the endpoint returns one document with every class and enum under `definitions`. This is the export to feed into generators — all types arrive in a single self-contained document.

{% code-tabs %}
{% code-tab label="TypeScript" %}
```typescript
const schema = await client.getJSONSchema()
// schema.definitions.Person, schema.definitions.Address, ...
```
{% /code-tab %}
{% code-tab label="Python" %}
```python
schema = client.get_json_schema()
# schema["definitions"]["Person"], schema["definitions"]["Address"], ...
```
{% /code-tab %}
{% code-tab label="HTTP (curl)" %}
```bash
curl -u admin:root \
  "http://localhost:6363/api/schema/admin/MyDatabase/local/branch/main?format=jsonschema"
```
{% /code-tab %}
{% /code-tabs %}

## Read the generated schema

The converter maps TerminusDB constructs onto JSON Schema where it can, and records what JSON Schema cannot express under an `x-terminusdb` extension object. Nothing degrades silently — a construct without a faithful mapping becomes a permissive schema plus a `limitations` note.

- `Optional` properties appear in `properties` but not in `required`. `Set`, `List`, `Array`, and `Cardinality` become `array` types; `Set` adds `uniqueItems`, `Cardinality` adds `minItems`/`maxItems`.
- Class links type as `string` — a document stores the linked document's `@id`. The target class is recorded at `x-terminusdb.link`; foreign links use `x-terminusdb.foreign`.
- Subdocuments inline up to depth 2, then emit `$ref` into `definitions`. Recursive schemas resolve correctly.
- Enum properties `$ref` into `definitions.EnumtraitValues.<Enum>`, where each value is a titled `oneOf` alternative.
- `@oneOf` groups become `oneOf` (single group) or `anyOf` of per-group `oneOf`s (several groups).
- `xsd` types map to `string`/`integer`/`number`/`boolean` with `format`, `minimum`, `maximum`, or `contentEncoding` where the datatype has a JSON Schema analogue. Temporal and QName-family types without an analogue carry `x-terminusdb.xsd_type`.
- Class-level metadata that JSON Schema cannot express — `@key`, `@abstract`, `@subdocument`, `@inherits`, `@unfoldable`, `@shared`, `@metadata` — is preserved under `x-terminusdb` together with `type_choices` (acceptable `@type` values, including concrete subclasses of abstract classes) and `id_pattern` (the `@id` shape the key strategy produces).

## Type the returned document

The schema arrives as plain JSON. You do not have to write a JSON Schema type by hand — import one:

{% code-tabs %}
{% code-tab label="TypeScript" %}
```typescript
import type { JSONSchema7 } from "json-schema"

const schema = await client.getJSONSchema("Person") as JSONSchema7
// schema.properties, schema.required, schema.definitions are typed
```
{% /code-tab %}
{% code-tab label="Python" %}
```python
schema: dict = client.get_json_schema("Person")
```
{% /code-tab %}
{% /code-tabs %}

`@types/json-schema` is a type-only dependency — nothing ships to production. The same `JSONSchema7` type is re-exported by `json-schema-to-typescript`, so a single devDependency covers typing the result *and* the generation below.

## Scaffold TypeScript typings from the schema

[`json-schema-to-typescript`](https://github.com/bcherny/json-schema-to-typescript) compiles a JSON Schema into TypeScript declarations. Install it in your project — it stays a devDependency, the client does not bundle it:

```bash
npm install --save-dev json-schema-to-typescript
```

```typescript
import { compile } from "json-schema-to-typescript"
import { writeFileSync } from "node:fs"

const schema = await client.getJSONSchema("Person")
const typings = await compile(schema, "Person")
writeFileSync("person.d.ts", typings)
```

Produces declarations shaped like:

```typescript
export interface Person {
  "@id"?: string
  "@type"?: string
  name: string
  age?: number
  has_parent?: string
}
```

Feed `client.getJSONSchema()` — the whole-database export — to the same call to emit every class in one declaration file, with `$ref` targets resolved through `definitions`.

{% callout type="note" %}
Linked classes become `string` properties, because a TerminusDB link serializes as the linked document's `@id`. Check `x-terminusdb.link` on a property if you want to emit a stricter union or a branded id type — the generator will not do it for you.
{% /callout %}

## Generate forms with rjsf

[react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) (rjsf) renders a working form straight from a JSON Schema — no client changes needed, it is just another consumer of the same document:

```bash
npm install @rjsf/core @rjsf/utils @rjsf/validator-ajv8
```

```tsx
import Form from "@rjsf/core"
import validator from "@rjsf/validator-ajv8"

const schema = await client.getJSONSchema("Person")

<Form schema={schema} validator={validator} onSubmit={({ formData }) => save(formData)} />
```

Field types, `required`, cardinality bounds, and enum dropdowns all come through automatically — enum properties land as labelled selects, because each alternative is a titled `oneOf`. Two practical notes:

- `@type` and `@id` render as editable string fields. Pin or hide them with `uiSchema` — e.g. `{ "@type": { "ui:widget": "hidden" } }` — and set the class name yourself, or leave them visible while prototyping.
- `x-terminusdb` extensions are ignored by rjsf. Use `uiSchema` or custom widgets for link fields if plain text entry is not what you want.

## What the export does not cover

The schema validates the JSON shape of documents, not every schema-level constraint. Know the edges before you treat generated typings as the contract:

- **Key strategies are not enforced.** `@key` (Lexical, Hash, ValueHash, Random) is recorded under `x-terminusdb.key`, and `x-terminusdb.id_pattern` describes the `@id` shape, but the server — not the schema — decides the actual id.
- **Foreign links cannot be verified.** A `Foreign` reference is a `string`; whether it points at a real external document is not checkable.
- **Unmapped `xsd` types degrade to permissive schemas.** The original type survives at `x-terminusdb.xsd_type` and the property notes the gap under `x-terminusdb.limitations`.
- **`@type` and `@id` accept any string.** The constrained choices and the id pattern live in `x-terminusdb`, not in the validating schema.
- Generated typings describe what the database *accepts*, which is a superset of what your application may want to *send* — domain-level constraints stay yours.
