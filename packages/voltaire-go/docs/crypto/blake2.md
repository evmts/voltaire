---
title: BLAKE2b
description: Pure-Go BLAKE2b-256 and BLAKE2b-512 one-shot and streaming hashing backed by golang.org/x/crypto/blake2b.
---

Package `github.com/voltaire-labs/voltaire-go/crypto/blake2` provides pure-Go BLAKE2b-256 and BLAKE2b-512 hashing (no CGO required) backed by `golang.org/x/crypto/blake2b`.

## Functions

| Function | Signature | Notes |
|----------|-----------|-------|
| `Hash` / `Sum256` | `(data []byte) [32]byte` | One-shot BLAKE2b-256 |
| `Hash512` / `Sum512` | `(data []byte) [64]byte` | One-shot BLAKE2b-512 |
| `HashString` | `(s string) [32]byte` | BLAKE2b-256 of UTF-8 string bytes |
| `HashToHex` | `(data []byte) string` | Lowercase 64-char BLAKE2b-256 hex **without** `0x` prefix |
| `New256` | `() (hash.Hash, error)` | Streaming `hash.Hash` for BLAKE2b-256 |
| `New512` | `() (hash.Hash, error)` | Streaming `hash.Hash` for BLAKE2b-512 |

## Example

```go
package main

import (
    "fmt"
    "log"

    "github.com/voltaire-labs/voltaire-go/crypto/blake2"
)

func main() {
    d256 := blake2.Hash([]byte("abc"))
    d512 := blake2.Hash512([]byte("abc"))
    fmt.Printf("BLAKE2b-256: %x\n", d256)
    fmt.Printf("BLAKE2b-512: %x\n", d512)
    fmt.Println("Hex (no 0x):", blake2.HashToHex([]byte("")))

    h, err := blake2.New256()
    if err != nil {
        log.Fatal(err)
    }
    h.Write([]byte("a"))
    h.Write([]byte("bc"))
    fmt.Printf("Streamed:    %x\n", h.Sum(nil))
}
```

## Reference Test Vectors

| Input | BLAKE2b-256 |
|-------|-------------|
| `""` | `0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8` |
| `"abc"` | `bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319` |

| Input | BLAKE2b-512 |
|-------|-------------|
| `""` | `786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce` |
| `"abc"` | `ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923` |
