---
title: RIPEMD-160
description: Pure-Go RIPEMD-160 hashing and Bitcoin Hash160 (RIPEMD160(SHA256(x))).
---

Package `github.com/voltaire-labs/voltaire-go/crypto/ripemd160` provides pure-Go 20-byte RIPEMD-160 hashing (Ethereum precompile `0x03`) and Bitcoin `Hash160` (`RIPEMD160(SHA256(data))`), backed by `golang.org/x/crypto/ripemd160` and `crypto/sha256`.

## Constants and Functions

```go
const Size = 20
const BlockSize = 64
```

| Function | Signature | Notes |
|----------|-----------|-------|
| `Hash` / `Sum` | `(data []byte) [20]byte` | One-shot RIPEMD-160 |
| `HashString` | `(s string) [20]byte` | RIPEMD-160 of UTF-8 string bytes |
| `HashToHex` | `(data []byte) string` | `0x`-prefixed lowercase 42-char hex string |
| `Hash160` | `(data []byte) [20]byte` | Computes `RIPEMD160(SHA256(data))` |
| `New` | `() hash.Hash` | Streaming `hash.Hash` instance |

## Example

```go
package main

import (
    "fmt"

    "github.com/voltaire-labs/voltaire-go/crypto/ripemd160"
)

func main() {
    fmt.Println("RIPEMD-160(\"abc\"):", ripemd160.HashToHex([]byte("abc")))
    // 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc

    h := ripemd160.New()
    h.Write([]byte("message "))
    h.Write([]byte("digest"))
    fmt.Printf("Streamed: %x\n", h.Sum(nil))

    // Bitcoin P2PKH / P2SH Hash160
    hash160 := ripemd160.Hash160([]byte("public-key-or-script"))
    fmt.Printf("Hash160:  0x%x\n", hash160)
}
```

## Reference Test Vectors

| Input | RIPEMD-160 |
|-------|------------|
| `""` | `9c1185a5c5e9fc54612808977ee8f548b2258d31` |
| `"a"` | `0bdc9d2d256b3ee9daae347be6f4dc835a467ffe` |
| `"abc"` | `8eb208f7e05d987a9b044a8e98c6b087f15a0bfc` |
| `"message digest"` | `5d0689ef49d2fae572b881b123a85ffa21595f36` |
