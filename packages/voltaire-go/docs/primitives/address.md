---
title: Address
description: 20-byte Ethereum Address type with EIP-55 checksum formatting, validation, and JSON/Text marshaling.
---

Package `github.com/voltaire-labs/voltaire-go/primitives/address` defines `Address`, a 20-byte fixed array backed by Voltaire's CGO FFI (`internal/ffi`).

## Type and Constants

```go
const Size = 20

type Address [Size]byte

var Zero Address
```

## Constructors

| Function | Signature | Behavior |
|----------|-----------|----------|
| `FromHex` | `(s string) (Address, error)` | Parses 40 hex chars with or without `0x` prefix |
| `FromBytes` | `(b []byte) (Address, error)` | Copies a 20-byte slice; errors if `len(b) != 20` |
| `MustFromHex` | `(s string) Address` | Calls `FromHex`, panics on error |
| `FromPublicKey` | `(publicKey []byte) (Address, error)` | Takes 64-byte uncompressed `X \|\| Y`, returns `keccak256(publicKey)[12:]` |
| `ValidateChecksum` | `(s string) bool` | Validates EIP-55 mixed-case checksum |
| `EncodeHex` | `(b []byte) string` | Encodes raw bytes to lowercase hex without `0x` |

`FromPrivateKey(privateKey []byte)` is currently stubbed and returns `"not implemented"`; derive addresses from a private key via `privatekey.FromBytes(b)` and `pk.Address()` instead.

## Methods

| Method | Signature | Behavior |
|--------|-----------|----------|
| `Hex` | `() string` | Lowercase `"0x"` + 40 hex chars |
| `ChecksumHex` | `() string` | EIP-55 mixed-case `"0x"` + 40 hex chars |
| `String` | `() string` | Alias for `ChecksumHex()` |
| `Bytes` | `() []byte` | Returns a 20-byte slice |
| `IsZero` | `() bool` | True if all 20 bytes are `0x00` |
| `Equal` | `(other Address) bool` | Byte-for-byte equality via FFI |
| `Compare` | `(b Address) int` | Lexicographical comparison (`-1`, `0`, `1`) |
| `MarshalText` / `UnmarshalText` | `encoding.TextMarshaler` / `TextUnmarshaler` | Encodes as `ChecksumHex()`, decodes via `FromHex` |
| `MarshalJSON` / `UnmarshalJSON` | `json.Marshaler` / `json.Unmarshaler` | JSON string containing `ChecksumHex()` |

## Example

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"

    "github.com/voltaire-labs/voltaire-go/primitives/address"
)

type Transfer struct {
    To address.Address `json:"to"`
}

func main() {
    addr, err := address.FromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(addr.Hex())         // 0xd8da6bf26964af9d7eed9e03e53415d37aa96045
    fmt.Println(addr.ChecksumHex()) // 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
    fmt.Println(address.ValidateChecksum(addr.ChecksumHex())) // true

    data, err := json.Marshal(Transfer{To: addr})
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(string(data)) // {"to":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}
}
```
