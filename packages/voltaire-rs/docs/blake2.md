# BLAKE2

BLAKE2 hash functions optimized for modern processors.

## Overview

- **BLAKE2b** - Optimized for 64-bit platforms, up to 64-byte output
- **BLAKE2s** - Optimized for 32-bit platforms, up to 32-byte output

Both are faster than MD5/SHA-1 while being as secure as SHA-3.

## BLAKE2b

```rust
use voltaire::crypto::{blake2b, Blake2b};

// One-shot hashing (32-byte output)
let hash = blake2b(b"hello", 32);

// Full 64-byte output
let hash = blake2b(b"hello", 64);

// Streaming
let mut hasher = Blake2b::new(32);
hasher.update(b"hello");
hasher.update(b" world");
let hash = hasher.finalize();
```

## BLAKE2s

```rust
use voltaire::crypto::{blake2s, Blake2s};

// One-shot hashing (32-byte output)
let hash = blake2s(b"hello", 32);

// Smaller output (16 bytes)
let hash = blake2s(b"hello", 16);

// Streaming
let mut hasher = Blake2s::new(32);
hasher.update(b"hello");
hasher.update(b" world");
let hash = hasher.finalize();
```

## Variable Output Length

Both functions support variable output length:

```rust
use voltaire::crypto::{blake2b, blake2s};

// BLAKE2b: 1-64 bytes
let hash_16 = blake2b(b"data", 16);
let hash_32 = blake2b(b"data", 32);
let hash_64 = blake2b(b"data", 64);

// BLAKE2s: 1-32 bytes
let hash_16 = blake2s(b"data", 16);
let hash_32 = blake2s(b"data", 32);
```

## Use Cases

- **Content addressing** - Fast content-based identifiers
- **Merkle trees** - Efficient proof construction
- **Checksums** - Fast integrity verification
- **Key derivation** - Variable-length output
