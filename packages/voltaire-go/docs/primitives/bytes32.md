---
title: Bytes32
description: Pure-Go fixed 32-byte array type with hex, JSON, and text marshaling and constant-time equality.
---

Package `github.com/voltaire-labs/voltaire-go/primitives/bytes32` defines `Bytes32`, a pure-Go fixed 32-byte array for hashes, storage slots, and 256-bit fixed values.

## Type and Constants

```go
const Size = 32

type Bytes32 [Size]byte

var Zero Bytes32
```

## API Reference

| Symbol | Signature | Behavior |
|--------|-----------|----------|
| `FromHex` | `(s string) (Bytes32, error)` | Parses 64 hex chars (optional `0x` prefix) |
| `FromBytes` | `(data []byte) (Bytes32, error)` | Copies exactly 32 bytes; errors otherwise |
| `MustFromHex` | `(s string) Bytes32` | Calls `FromHex`, panics on error |
| `Hex` / `String` | `() string` | Lowercase `"0x"` + 64 hex chars |
| `Bytes` | `() []byte` | Returns 32-byte slice |
| `IsZero` | `() bool` | True if all 32 bytes are `0x00` |
| `Equal` | `(other Bytes32) bool` | Constant-time equality |
| `Compare` | `(other Bytes32) int` | Lexicographical comparison (`-1`, `0`, `1`) |
| `MarshalText` / `UnmarshalText` | `encoding.TextMarshaler` / `TextUnmarshaler` | Lowercase `0x`-prefixed hex |
| `MarshalJSON` / `UnmarshalJSON` | `json.Marshaler` / `json.Unmarshaler` | JSON string containing `Hex()` |

## Example

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"

    "github.com/voltaire-labs/voltaire-go/primitives/bytes32"
)

type StorageSlot struct {
    Key   bytes32.Bytes32 `json:"key"`
    Value bytes32.Bytes32 `json:"value"`
}

func main() {
    key, err := bytes32.FromHex("0x0000000000000000000000000000000000000000000000000000000000000001")
    if err != nil {
        log.Fatal(err)
    }

    raw, err := json.Marshal(StorageSlot{Key: key, Value: bytes32.Zero})
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(string(raw))
}
```
