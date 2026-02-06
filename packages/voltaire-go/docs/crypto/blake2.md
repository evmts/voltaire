---
title: BLAKE2b
description: High-performance cryptographic hash function
---

# BLAKE2b

The `blake2` package provides BLAKE2b hashing, a high-performance cryptographic
hash function used by some Ethereum L2s and general cryptography applications.

BLAKE2b is faster than MD5, SHA-1, SHA-2, and SHA-3, while being at least as
secure as SHA-3. It supports variable output lengths from 1 to 64 bytes.

## Basic Usage

### Hash Bytes (256-bit)

```go
import "github.com/voltaire-labs/voltaire-go/crypto/blake2"

data := []byte("hello world")
hash := blake2.Hash(data)
// Returns [32]byte
```

### Hash Bytes (512-bit)

```go
hash := blake2.Hash512(data)
// Returns [64]byte
```

### Hash String

```go
hash := blake2.HashString("hello")
// Returns [32]byte (256-bit)
```

### Hash to Hex

```go
hex := blake2.HashToHex([]byte("hello"))
// "0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8"
```

## Incremental Hashing

For large data or streaming, use the hash.Hash interface:

```go
h, _ := blake2.New256()
h.Write([]byte("hello"))
h.Write([]byte(" world"))
result := h.Sum(nil)
// Returns 32 bytes
```

```go
h, _ := blake2.New512()
h.Write([]byte("hello"))
h.Write([]byte(" world"))
result := h.Sum(nil)
// Returns 64 bytes
```

## Aliases

For consistency with other hash packages:

```go
hash := blake2.Sum256(data)  // Same as Hash(data)
hash := blake2.Sum512(data)  // Same as Hash512(data)
```

## Test Vectors

### BLAKE2b-256

| Input | BLAKE2b-256 |
|-------|-------------|
| "" (empty) | 0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8 |
| "abc" | bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319 |

### BLAKE2b-512

| Input | BLAKE2b-512 |
|-------|-------------|
| "" (empty) | 786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce |
| "abc" | ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923 |

## Performance

BLAKE2b is significantly faster than SHA-256 and Keccak-256 while providing
equivalent security. It's particularly efficient for:

- Content addressing
- Fast checksums
- Merkle tree construction
- Any application needing fast, secure hashing
