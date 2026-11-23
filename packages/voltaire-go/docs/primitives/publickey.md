---
title: PublicKey
description: secp256k1 PublicKey supporting 33-byte compressed, 64-byte raw, and 65-byte prefixed formats plus Ethereum address derivation.
---

Package `github.com/voltaire-labs/voltaire-go/primitives/publickey` stores a secp256k1 point internally as 65 uncompressed bytes (`0x04 || X || Y`) and accepts 33-byte compressed, 64-byte raw, or 65-byte prefixed inputs.

## Supported Encodings

| Format | Byte Length | Prefix | Hex Length (`0x` + digits) |
|--------|-------------|--------|----------------------------|
| Prefixed uncompressed | `65` | `0x04` | `132` chars (`pk.Hex()`) |
| Raw uncompressed | `64` | None (`X \|\| Y`) | `130` chars |
| Compressed (SEC1) | `33` | `0x02` (even `Y`) / `0x03` (odd `Y`) | `68` chars (`pk.HexCompressed()`) |

## API Reference

| Symbol | Signature | Behavior |
|--------|-----------|----------|
| `FromBytes` | `(b []byte) (PublicKey, error)` | Parses 33-, 64-, or 65-byte key and verifies point is on secp256k1 |
| `FromHex` | `(s string) (PublicKey, error)` | Decodes hex (optional `0x`) and calls `FromBytes` |
| `MustFromHex` | `(s string) PublicKey` | Calls `FromHex`, panics on error |
| `Bytes` | `() []byte` | Returns 65-byte `04 \|\| X \|\| Y` |
| `BytesUncompressed` | `() []byte` | Returns 64-byte `X \|\| Y` |
| `BytesCompressed` | `() []byte` | Returns 33-byte `02/03 \|\| X` |
| `Hex` | `() string` | Returns `0x`-prefixed 65-byte uncompressed hex (`132` chars) |
| `HexCompressed` | `() string` | Returns `0x`-prefixed 33-byte compressed hex (`68` chars) |
| `String` | `() string` | Alias for `HexCompressed()` |
| `Address` | `() address.Address` | Computes `keccak256(X \|\| Y)[12:]` via CGO FFI |
| `IsValid` | `() bool` | Verifies `(X, Y)` lies on `y^2 = x^3 + 7 (mod p)` |
| `Equal` | `(other PublicKey) bool` | Constant-time equality |
| `MarshalText` / `MarshalJSON` | — | Encodes as `HexCompressed()`; unmarshaling accepts 33-, 64-, or 65-byte hex |
| `ToECDSA` | `() *ecdsa.PublicKey` | Converts coordinates to `*ecdsa.PublicKey` (note: uses P-256 curve placeholder for stdlib struct compatibility) |

## Example

```go
package main

import (
    "fmt"
    "log"

    "github.com/voltaire-labs/voltaire-go/primitives/publickey"
)

func main() {
    // secp256k1 generator point G (compressed)
    pk, err := publickey.FromHex(
        "0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
    )
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("Compressed:  ", pk.HexCompressed())
    fmt.Println("Uncompressed:", pk.Hex())
    fmt.Println("Address:     ", pk.Address().ChecksumHex())
    fmt.Println("Valid:       ", pk.IsValid())
}
```
