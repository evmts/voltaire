---
title: RIPEMD-160
description: 160-bit cryptographic hash function used in Bitcoin
---

# RIPEMD-160

The `ripemd160` package provides RIPEMD-160 hashing, a 160-bit (20-byte)
cryptographic hash function used in Bitcoin for address derivation.

## Basic Usage

### Hash Bytes

```go
import "github.com/voltaire-labs/voltaire-go/crypto/ripemd160"

data := []byte("hello")
hash := ripemd160.Hash(data)
fmt.Printf("%x\n", hash) // 108f07b8382511...
```

### Hash String

```go
hash := ripemd160.HashString("abc")
// 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
```

### Hash to Hex

```go
hex := ripemd160.HashToHex([]byte("abc"))
// "0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc"
```

### Hash160 (Bitcoin Style)

```go
// RIPEMD160(SHA256(data)) - commonly used in Bitcoin
hash160 := ripemd160.Hash160(publicKey)
```

### Incremental Hashing

```go
h := ripemd160.New()
h.Write([]byte("hello"))
h.Write([]byte(" world"))
hash := h.Sum(nil)
```

## Bitcoin Use Cases

### P2PKH Address Generation

```go
import (
    "github.com/voltaire-labs/voltaire-go/crypto/ripemd160"
    "github.com/voltaire-labs/voltaire-go/crypto/sha256"
)

// Public key hash = RIPEMD160(SHA256(pubkey))
pubKeyHash := ripemd160.Hash160(compressedPubKey)

// Add version byte and checksum for final address
```

### P2SH Script Hash

```go
// Script hash = RIPEMD160(SHA256(redeemScript))
scriptHash := ripemd160.Hash160(redeemScript)
```

## Test Vectors

Official RIPEMD-160 test vectors:

| Input | RIPEMD-160 |
|-------|------------|
| "" (empty) | 9c1185a5c5e9fc54612808977ee8f548b2258d31 |
| "a" | 0bdc9d2d256b3ee9daae347be6f4dc835a467ffe |
| "abc" | 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc |
| "message digest" | 5d0689ef49d2fae572b881b123a85ffa21595f36 |

## API Reference

### Functions

- `Hash(data []byte) [20]byte` - Compute RIPEMD-160 hash
- `HashString(s string) [20]byte` - Hash a UTF-8 string
- `HashToHex(data []byte) string` - Hash and return hex string with 0x prefix
- `Hash160(data []byte) [20]byte` - Compute RIPEMD160(SHA256(data))
- `Sum(data []byte) [20]byte` - Alias for Hash
- `New() hash.Hash` - Create incremental hasher
