---
title: Keccak-256
description: CGO-backed Keccak-256 hashing returning typed 32-byte hash.Hash digests.
---

Package `github.com/voltaire-labs/voltaire-go/crypto/keccak256` computes Ethereum's pre-NIST Keccak-256 (`0x01` domain padding, distinct from SHA3-256) via Voltaire's native Zig C ABI (`internal/ffi`) and returns `hash.Hash`.

## Functions

| Function | Signature | Behavior |
|----------|-----------|----------|
| `Hash` | `(data []byte) hash.Hash` | Hashes a single byte slice |
| `HashString` | `(s string) hash.Hash` | Hashes UTF-8 bytes of `s` |
| `Sum` | `(data ...[]byte) hash.Hash` | Concatenates variadic byte slices and hashes the result |

## Example

```go
package main

import (
    "fmt"

    "github.com/voltaire-labs/voltaire-go/crypto/keccak256"
)

func main() {
    // 4-byte ERC-20 function selector
    selHash := keccak256.HashString("transfer(address,uint256)")
    fmt.Printf("selector: 0x%x\n", selHash.Bytes()[:4]) // 0xa9059cbb

    // 32-byte ERC-20 event topic0
    topic := keccak256.HashString("Transfer(address,address,uint256)")
    fmt.Println("topic0:", topic.Hex())

    // Multi-slice concatenation
    combined := keccak256.Sum([]byte("hello"), []byte(" "), []byte("world"))
    fmt.Println("combined:", combined.Hex())
}
```

## Reference Test Vectors

| Input | Keccak-256 |
|-------|------------|
| `""` | `0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470` |
| `"hello"` | `0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8` |
