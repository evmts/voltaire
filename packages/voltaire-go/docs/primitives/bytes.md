---
title: Bytes
description: Byte slice utilities with safe operations and constant-time comparison
---

# Bytes

The `bytes` package provides utilities for working with byte slices in a safe and idiomatic way.

## Functions

### Concat

Concatenate multiple byte slices:

```go
result := bytes.Concat([]byte{0xde, 0xad}, []byte{0xbe, 0xef})
// []byte{0xde, 0xad, 0xbe, 0xef}

// Variadic - any number of slices
result := bytes.Concat(a, b, c, d)
```

### Slice

Safe slicing with bounds checking:

```go
data := []byte{0, 1, 2, 3, 4, 5}

result, err := bytes.Slice(data, 1, 4)
// []byte{1, 2, 3}, nil

// Out of bounds returns error
_, err := bytes.Slice(data, 0, 100)
// bytes.ErrOutOfBounds
```

### PadLeft / PadRight

Pad byte slices to a target size:

```go
data := []byte{0x01, 0x02}

// Pad left with zeros
result := bytes.PadLeft(data, 4, 0x00)
// []byte{0x00, 0x00, 0x01, 0x02}

// Pad right with zeros
result := bytes.PadRight(data, 4, 0x00)
// []byte{0x01, 0x02, 0x00, 0x00}

// Custom pad byte
result := bytes.PadLeft(data, 4, 0xff)
// []byte{0xff, 0xff, 0x01, 0x02}

// No-op if already at or exceeds target size
result := bytes.PadLeft(data, 2, 0x00)
// []byte{0x01, 0x02}
```

### TrimLeft / TrimRight

Remove leading or trailing bytes:

```go
data := []byte{0x00, 0x00, 0x01, 0x02, 0x00}

// Trim leading zeros
result := bytes.TrimLeft(data, 0x00)
// []byte{0x01, 0x02, 0x00}

// Trim trailing zeros
result := bytes.TrimRight(data, 0x00)
// []byte{0x00, 0x00, 0x01, 0x02}
```

### Equal

Constant-time comparison for cryptographic safety:

```go
a := []byte{0xde, 0xad, 0xbe, 0xef}
b := []byte{0xde, 0xad, 0xbe, 0xef}
c := []byte{0xca, 0xfe, 0xba, 0xbe}

bytes.Equal(a, b) // true
bytes.Equal(a, c) // false

// Safe for secret comparison - no timing side-channel
bytes.Equal(userSecret, storedSecret)
```

### IsZero

Check if all bytes are zero:

```go
zeros := []byte{0x00, 0x00, 0x00}
bytes.IsZero(zeros) // true

data := []byte{0x00, 0x01, 0x00}
bytes.IsZero(data) // false

bytes.IsZero([]byte{}) // true (empty is zero)
```

### Reverse

Reverse byte order (useful for endianness conversion):

```go
data := []byte{0x01, 0x02, 0x03, 0x04}
result := bytes.Reverse(data)
// []byte{0x04, 0x03, 0x02, 0x01}

// Original unchanged
// data is still []byte{0x01, 0x02, 0x03, 0x04}
```

### Copy

Safe copy that allocates new memory:

```go
original := []byte{0xde, 0xad, 0xbe, 0xef}
copied := bytes.Copy(original)

// Modifications to copy don't affect original
copied[0] = 0x00
// original[0] is still 0xde
```

## Errors

- `ErrOutOfBounds` - Slice indices exceed array bounds
- `ErrNegativeIndex` - Negative start or end index

## Example: Building Ethereum Transaction Data

```go
package main

import (
    "github.com/voltaire-labs/voltaire-go/primitives/bytes"
)

func main() {
    // Build calldata: selector + padded argument
    selector := []byte{0xa9, 0x05, 0x9c, 0xbb} // transfer(address,uint256)
    recipient := []byte{0xd8, 0xda, 0x6b, 0xf2} // truncated for example
    amount := []byte{0x01}

    // Pad address to 32 bytes (left-padded)
    paddedRecipient := bytes.PadLeft(recipient, 32, 0x00)

    // Pad amount to 32 bytes (left-padded for uint256)
    paddedAmount := bytes.PadLeft(amount, 32, 0x00)

    // Concatenate into calldata
    calldata := bytes.Concat(selector, paddedRecipient, paddedAmount)
}
```
