---
title: "TerminusDB Internals Part 3 - Sorting Every Sort of Thing"
date: 2022-11-21
nextjs:
  metadata:
    title: "TerminusDB Internals Part 3 - Sorting Every Sort of Thing"
    description: "Part 3 of TerminusDB Internals looks at how we sort data lexically and how we have overcome some of the issues that come with this approach."
    keywords: TerminusDB, graph database, lexical sorting, integers, floats, decimals, big integers, succinct data structures
    alternates:
      canonical: https://terminusdb.org/blog/2022-11-21-terminusdb-internals-3/
    openGraph:
      type: article
      publishedTime: "2022-11-21T00:00:00Z"
      images: https://terminusdb.com/wp-content/uploads/2022/10/terminusdb-internals-part-3-og.jpg
media: []
---

> Author: Gavin Mendel-Gleason

Some of the original experiments with TerminusDB were in Postgres, where we built a table of IRIs and ids, and then created a multi-indexed table of triples. We then compared the speed of this to a library called HDT which created a compact representation of graphs, and found HDT to be extremely fast for large RDF databases (Think TTL files over 100GB).

This got us thinking seriously about succinct data structures, so we used the ideas in HDT as a starting point for TerminusDB.

One of the choices made by HDT is the [front coded dictionary](https://en.wikipedia.org/wiki/Incremental_encoding). This tends to work very well for IRIs, since we tend to share addresses as prefixes, leading to substantial compression and reasonable retrieval speed.

The dictionary relies on lexical sorting of data, as we want to branch at points that share prefixes. So sorting lexically helps us to maximally share prefixes.

Lexical ordering also allows us to start with a prefix, and iterate over everything that shares it, or to perform fast range queries, simply by finding the beginning point, and iterating until we are at the terminus of the range.

So we get:

- Compression
- Log like access
- Range queries

But not everything is naturally designed to be stored lexically. Take the classic example of the directory in Linux:

```
gavin@titan:~/tmp/sort$ touch 2
gavin@titan:~/tmp/sort$ touch 11
gavin@titan:~/tmp/sort$ touch 10
gavin@titan:~/tmp/sort$ touch 100
gavin@titan:~/tmp/sort$ touch 101
gavin@titan:~/tmp/sort$ touch 110
gavin@titan:~/tmp/sort$ ls -la
total 8
drwxrwxr-x  2 gavin gavin 4096 Okt 31 11:59 .
drwxrwxr-x 14 gavin gavin 4096 Okt 31 11:59 ..
-rw-rw-r--  1 gavin gavin    0 Okt 31 11:59 1
-rw-rw-r--  1 gavin gavin    0 Okt 31 11:59 10
-rw-rw-r--  1 gavin gavin    0 Okt 31 11:59 100
-rw-rw-r--  1 gavin gavin    0 Okt 31 11:59 101
-rw-rw-r--  1 gavin gavin    0 Okt 31 11:59 11
-rw-rw-r--  1 gavin gavin    0 Okt 31 11:59 110
-rw-rw-r--  1 gavin gavin    0 Okt 31 11:59 2
```

In this world 101 is less than 11, and 2 is greater than 110. Not what we typically want when we are sorting numbers.

## Lexical Everything

But as it turns out, numbers can also be sorted lexically, provided we store them in a clever way. These lexical ordering tricks can give us id<->data conversion using dictionaries, which allows for compression, prefix queries and range queries.

### Integers

So how do we get 100 to be larger than 2? If we have *fixed* size integers, such as Int32, the answer is relatively simple. We break Int32 into 4 bytes written out in [big endian](https://en.wikipedia.org/wiki/Endianness). We're almost done save one complication. In most representations, we keep around a *sign* bit on integers, generally stored in the most significant position, which is 1 if the number is negative, and 0 if it is positive.

This is terrible, since all negative numbers are now larger than positive numbers. Further, integers are generally stored in a [two's complement](https://en.wikipedia.org/wiki/Two%27s_complement), meaning that we flip every bit of a negative number. This is actually a *good* thing. Because it means that smaller numbers are bigger, and bigger numbers are smaller. Which is exactly how we expect negative numbers to sort! That is, -10 should be smaller than -1.

```
-1 = 0bffff_fffe
```

To fix the sign problem is simple. We just flip the sign bit and we are done! We now have lexically sortable integers.

### Floats

IEEE floating point numbers are also surprisingly simple to sort lexically. We have the same trick, requiring a sign flip, but in the case of negative numbers, we actually have to put them in the two's complement representation, as floating point can't avail of the same twos complement tricks used in integer arithmetic, so this is computed externally.

This is all there is to it in rust (using the `bytes_order` library to ensure we get a big endian representation).

```rust
const F32_SIGN_MASK: u32 = 0x8000_0000;
const F32_COMPLEMENT: u32 = 0xffff_ffff;
fn float32_to_vec(f: &f32) -> Vec<u8> {
    let g: f32 = if f.to_bits() & F32_SIGN_MASK > 0 {
        f32::from_bits(f.to_bits() ^ F32_COMPLEMENT)
    } else {
        f32::from_bits(f.to_bits() ^ F32_SIGN_MASK)
    };
    let mut wtr = Vec::with_capacity(4);
    wtr.write_f32::<BigEndian>(g).unwrap();
    wtr
}
```

### Decimals

Decimals are a bit more complex. In TerminusDB we store decimals as arbitrary precision rational numbers. This means we need to be able to compare two rationals lexically.

The approach we take is to convert the rational to a continued fraction representation, and then store that. Continued fractions have the nice property that they can be compared lexically by comparing their coefficients.

### Big Integers

For arbitrary precision integers (big integers), we use a variable length encoding. The idea is to prefix the number with its length, so that longer numbers sort after shorter ones. We also need to handle negative numbers, which we do by inverting the bits for negative numbers (similar to the two's complement trick).

## Conclusion

The lexical sorting approach gives us a unified way to handle all types of data in our succinct data structures. By carefully encoding each type, we can:

- Store everything in the same dictionary structure
- Perform efficient range queries on any type
- Maintain good compression through prefix sharing

This completes our three-part series on TerminusDB internals. We've covered:

1. [Part 1](/blog/2022-11-07-terminusdb-internals/) - Succinct data structures and graph storage
2. [Part 2](/blog/2022-11-14-terminusdb-internals-2/) - Delta encoding and immutable updates
3. Part 3 (this post) - Lexical sorting of all data types

For more technical details, see our [white paper on succinct data structures](/blog/2023-01-05-succinct-data-structures-for-modern-databases/).
