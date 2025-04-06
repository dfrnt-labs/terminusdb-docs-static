---
title: Schema Migration Reference Guide
slug: schema-migration-reference-guide
seo:
  title: Schema Migration Reference Guide
  description: >-
    A reference guide explaining the schema migration capabilities of
    TerminusCMS and TerminusDB
  og_image: >-
    https://assets.terminusdb.com/docs/technical-documentation-terminuscms-og.png
media: []
---

Schema migration allows us to move schema and instance data together automatically in a replayable fashion. This is essential for allowing flexible schemas to co-exist nicely with change-requests and merges.

The schema operations can be performed directly on the branch of interest, or you can _target_ the schema of a given branch in another branch, allowing the migrations to be re-performed such that a new common schema is obtained.

In addition, schema migrations can be _inferred_ in some cases, and TerminusCMS will attempt to silently infer migrations which will not impact instance data.

However, some schema operations require instance data to change, and such alterations must be asked for explicitly.

## Schema Migration Operations

There are a number of schema operations which can be performed which will change one schema into another. These are specified by passing an ordered list of operations. The operations are sometimes order dependent so different operations orders can lead to different changes to the instance data.

Some operations are known as [weakening](/docs/what-is-schema-weakening/) operations, as they can always be performed without altering the existing instance data. These are essentially _backward compatible_ operations. This includes changing a range to a less specific or optional range, adding new optional fields, or adding new classes.

## DeleteClass

The `DeleteClass` operation will remove a class from a schema. This does not change the _range_ of properties, so these properties must first be dropped before deleting a class is possible.

Due to the fact that existing instance data of this class will be deleted, this is not a _weakening_ operation.

```typescript
{ "@type" : "DeleteClass",
  "class" : <ClassName> }
```

An example of the operation would be:

```typescript
{ "@type" : "DeleteClass",
  "class" : "Person" }
```

Which would take the schema:

```typescript
{ "@id" : "Dog",
  "@type" : "Class",
  "name" : "xsd:string"}
{ "@id" : "Person",
  "@type" : "Class",
  "name" : "xsd:string" }
```

to:

```typescript
{ "@id" : "Dog",
  "@type" : "Class",
  "name" : "xsd:string"}
```

## CreateClass

The `CreateClass` operation specifies the entire class to be created. This operation is always a _weakening_ operation.

```typescript
{ "@type" : "CreateClass",
  "class_document" : <ClassDocument> }
```

### Example

The migration:

```typescript
{ "@type" : "CreateClass",
  "class_document" :
  { "@id" : "Person",
    "@type" : "Class",
    "name" : "xsd:string" } }
```

Would take the schema:

```typescript
{ "@id" : "Dog",
  "@type" : "Class",
  "name" : "xsd:string" }
```

to:

```typescript
{ "@id" : "Dog",
  "@type" : "Class",
  "name" : "xsd:string"}
{ "@id" : "Person",
  "@type" : "Class",
  "name" : "xsd:string" }
```

## MoveClass

The `MoveClass` operation renames a class and all of the URIs of instance data associated with that class. Due to the side-effects on instance data, this is not a _weakening_ operation.

```typescript
{ "@type" : "MoveClass",
  "from" : <FromClassName>,
  "to" : <ToClassName> }
```

### Example

```typescript
{ "@type" : "MoveClass",
  "from" : "Person",
  "to" : "Dog" }
```

Would take the schema:

```typescript
{ "@id" : "Person",
  "@type" : "Class",
  "name" : "xsd:string"}
```

to:

```typescript
{ "@id" : "Dog",
  "@type" : "Class",
  "name" : "xsd:string"}
```

## ReplaceClassMetadata

The `ReplaceClassMetadata` operation replaces the metadata on a class (if it exists). This operation is always a _weakening_ operation and has no effect on instance data.

```typescript
{ "@type" : "ReplaceClassMetadata",
  "class" : <ClassName>
  "metadata" : <Metadata> }
```

### Example

The operation:

```typescript
{ "@type" : "ReplaceClassMetadata",
  "class" : "Person",
  "metadata" : { "ui_preferences" : { "colour" : "blue" } } }
```

Would take the schema:

```typescript
{ "@id" : "Person",
  "@type" : "Class",
  "@metadata" : { "ui_preferences" : { "colour" : "red" } },
  "name" : "xsd:string"}
```

to:

```typescript
{ "@id" : "Dog",
  "@type" : "Class",
  "@metadata" : { "ui_preferences" : { "colour" : "blue" } },
  "name" : "xsd:string" }
```

## ReplaceClassDocumentation

The `ReplaceClassDocumentation` operation replaces the documentation on a class (if it exists). This operation is always a _weakening_ operation and has no effect on instance data.

```typescript
{ "@type" : "ReplaceClassDocumentation",
  "class" : <ClassName>
  "documentation" : <Documentation> }
```

### Example

The operation:

```typescript
{ "@type" : "ReplaceClassDocumentation",
  "class" : "Person",
  "documentation" : { "@comment" : "This is a person class",
                      "@properties" : { "name" : { "@comment" : "The name of a person",
                                                    "@label" : "name" } },
                      "@label" : "Person" } }
```

Would take the schema:

```typescript
{ "@id" : "Person",
  "@type" : "Class",
  "@documentation" : { "@comment" : "A Person",
                       "@properties" : { "name" : { "@comment" : "Name of a person",
                                                    "@label" : "name" } },
                       "@label" : "Person" },
  "name" : "xsd:string"}
```

to:

```typescript
{ "@id" : "Person",
  "@type" : "Class",
  "@documentation" : { "@comment" : "This is a person class",
                      "@properties" : { "name" : { "@comment" : "The name of a person",
                                                   "@label" : "name" } },
                      "@label" : "Person" },
  "name" : "xsd:string"}
```

## ReplaceContext

The `ReplaceContext` operation will update the context object, which will change how URIs are compressed when returning data.

This operation is a _weakening_ operation only when prefixes other than `@base` and `@schema` are changed. Otherwise, all data in the database will be moved to the new `@base` and `@schema` designations.

```typescript
{ "@type" : "ReplaceContext",
  "context" : <Context> }
```

## ExpandEnum

The `ExpandEnum` operation will allow new fields to be added to an `Enum`. This operation is always a weakening operation.

```typescript
{ "@type" : "ExpandEnum",
  "enum" : <EnumName>,
  "values" : [<Value0>, ... <ValueN>] }
```

### Example

The command

```typescript
{ "@type" : "ReplaceContext",
  "context" : { "@type" : "@context",
                "@base" : "iri://terminusdb.com/data",
                "@schema" : "iri://terminusdb.com/schema#" } }
```

Will take a schema:

```typescript
{ "@type" : "@context",
  "@base" : "http://example.com/data",
  "@schema" : "http://example.com/schema#" }
{ "@id" : "Person",
  "@type" : "Class",
  "name" : "xsd:string"}
```

To the schema:

```typescript
{ "@type" : "@context",
  "@base" : "iri://terminusdb.com/data",
  "@schema" : "iri://terminusdb.com/schema#" }
{ "@id" : "Person",
  "@type" : "Class",
  "name" : "xsd:string"}
```

## DeleteClassProperty

The `DeleteClassProperty` command removes a property from the schema and deletes all associated data points in the instance graph. This is not a _weakening_ operation.

```typescript
{ "@type" : "DeleteClassProperty",
  "class" : <ClassName>
  "property" : <PropertyName> }
```

## CreateClassProperty

The `CreateClassProperty` command creates a new property of a given name and type. It is a weakening operation only if the type is within a type family which includes:

*   Cardinality including zero
*   A Set
*   An Optional
*   An Array

Notably this excludes lists and required properties. With lists it will require the addition of the empty list resulting in a _strengthening_. The operation is impossible with a required property unless a default is specified.

```typescript
{ "@type" : "CreateClassProperty",
  "class" : <ClassName>,
  "property" : <PropertyName>,
  "type" : <Type> }
```

Or

```typescript
{ "@type" : "CreateClassProperty",
  "class" : <ClassName>,
  "property" : <PropertyName>,
  "type" : <Type>,
  "default" : <DefaultValue> }
```

## MoveClassProperty

The `MoveClassProperty` command will move the name of a property from one name to another.

```typescript
{ "@type" : "MoveClassProperty",
  "class" : <ClassName>,
  "from" : <PropertyName>,
  "to" : <PropertyName> }
```

This operation is never a weakening.

## UpcastClassProperty

The `UpcastClassProperty` command will weaken a type to another type which is a supertype or inclusive type family (such as moving a required or Optional to Set).

This operation is always a weakening.

```typescript
{ "@type" : "UpcastClassProperty",
  "class" : <ClassName>
  "property" : <PropertyName>,
  "type" : <TypeSpecification> }
```

## CastClassProperty

The `CastClassProperty` command will attempt to cast a property type to another type (such as a string to a date). This operation is never a weakening operation as it requires changing the type layout of data.

```typescript
{ "@type" : "CastClassProperty",
  "class" : <ClassName>
  "property" : <PropertyName>,
  "type" : <TypeSpecification>,
  "default" : <DefaultOrError> }
```

The \`DefaultOrError document is of the form:

```typescript
{ "@type" : "Error" }
```

Which will result in an error if casting is impossible, or:

```typescript
{ "@type" : "Default",
  "value" : <Value> }
```

Where `Value` is the value within type `TypeSpecification` which will be used if casting is impossible.

## ChangeKey (unimplemented)

## ChangeParents (unimplemented)

## ChangeCollection (unimplemented)