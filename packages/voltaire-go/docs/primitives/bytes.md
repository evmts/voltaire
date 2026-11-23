---
title: Bytes
description: Pure-Go byte slice utilities for concatenation, bounds-checked slicing, padding, trimming, and constant-time comparison.
---

Package `github.com/voltaire-labs/voltaire-go/primitives/bytes` provides pure-Go byte slice helpers that do not mutate caller inputs and use constant-time comparison for equality.

## Functions

| Function | Signature | Behavior |
|----------|-----------|----------|
| `Concat` | `(slices ...[]byte) []byte` | Allocates a new slice containing all inputs concatenated |
| `Slice` | `(b []byte, start, end int) ([]byte, error)` | Bounds-checked copy of `b[start:end]`; returns `ErrNegativeIndex` or `ErrOutOfBounds` |
| `PadLeft` | `(b []byte, size int, padByte byte) []byte` | Left-pads to `size`; returns copy unchanged if `len(b) >= size` |
| `PadRight` | `(b []byte, size int, padByte byte) []byte` | Right-pads to `size`; returns copy unchanged if `len(b) >= size` |
| `TrimLeft` | `(b []byte, trimByte byte) []byte` | Strips leading `trimByte` bytes |
| `TrimRight` | `(b []byte, trimByte byte) []byte` | Strips trailing `trimByte` bytes |
| `Equal` | `(a, b []byte) bool` | Constant-time equality (`crypto/subtle`) |
| `IsZero` | `(b []byte) bool` | Returns `true` if empty or all bytes equal `0x00` |
| `Reverse` | `(b []byte) []byte` | Returns a new slice with reversed byte order |
| `Copy` | `(b []byte) []byte` | Allocates an independent copy |

Exported sentinel errors: `ErrOutOfBounds`, `ErrNegativeIndex`.

## Example

```go
package main

import (
    "fmt"

    "github.com/voltaire-labs/voltaire-go/primitives/bytes"
)

func main() {
    selector := []byte{0xa9, 0x05, 0x9c, 0xbb}
    amount := bytes.PadLeft([]byte{0x03, 0xe8}, 32, 0x00) // 1000 as 32-byte word

    payload := bytes.Concat(selector, amount)
    trimmed := bytes.TrimLeft(amount, 0x00)

    fmt.Printf("payload len=%d, trimmed=%x, equal=%v\n",
        len(payload), trimmed, bytes.Equal(trimmed, []byte{0x03, 0xe8}))
}
```
