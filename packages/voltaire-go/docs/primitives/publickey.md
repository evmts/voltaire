---
title: PublicKey
description: secp256k1 public key with compressed/uncompressed support
---

# PublicKey

The `publickey` package provides secp256k1 public key operations with support for
both compressed and uncompressed formats.

## Type Definition

```go
type PublicKey struct {
    bytes [65]byte // 04 || X || Y (uncompressed form internally)
}
```

Internally stores the 65-byte uncompressed format (04 prefix + 32-byte X + 32-byte Y).

## Formats

| Format | Length | Description |
|--------|--------|-------------|
| Uncompressed (prefixed) | 65 bytes | `04 \|\| X \|\| Y` |
| Uncompressed (raw) | 64 bytes | `X \|\| Y` |
| Compressed | 33 bytes | `02/03 \|\| X` (02 if Y is even, 03 if Y is odd) |

## Creating Public Keys

### FromBytes

Parse from bytes (accepts 33, 64, or 65 byte inputs):

```go
// From compressed (33 bytes)
compressed := []byte{0x02, ...} // 33 bytes
pk, err := publickey.FromBytes(compressed)

// From uncompressed without prefix (64 bytes)
raw := []byte{...} // 64 bytes X || Y
pk, err := publickey.FromBytes(raw)

// From uncompressed with prefix (65 bytes)
prefixed := []byte{0x04, ...} // 65 bytes
pk, err := publickey.FromBytes(prefixed)
```

### FromHex

Parse from hex string:

```go
// Compressed hex (66 chars with 0x prefix)
pk, err := publickey.FromHex("0x02...")

// Uncompressed hex (130 chars with 0x prefix)
pk, err := publickey.FromHex("0x04...")
```

### MustFromHex

Parse from hex, panic on error:

```go
pk := publickey.MustFromHex("0x02...")
```

## Methods

### Bytes / BytesUncompressed / BytesCompressed

```go
pk.Bytes()             // 65 bytes: 04 || X || Y
pk.BytesUncompressed() // 64 bytes: X || Y (no prefix)
pk.BytesCompressed()   // 33 bytes: 02/03 || X
```

### Hex / HexCompressed

```go
pk.Hex()           // "0x04..." (130 chars)
pk.HexCompressed() // "0x02..." or "0x03..." (68 chars)
```

### Address

Derive Ethereum address (keccak256 of uncompressed key, last 20 bytes):

```go
addr := pk.Address()
// Returns address.Address
```

### IsValid

Check if the public key point is on the secp256k1 curve:

```go
if pk.IsValid() {
    // Valid point on curve
}
```

### Equal

Compare two public keys:

```go
if pk1.Equal(pk2) {
    // Keys are equal
}
```

## JSON/Text Marshaling

Public keys marshal to compressed hex (68 chars with 0x prefix):

```go
type Wallet struct {
    PubKey publickey.PublicKey `json:"pubKey"`
}

w := Wallet{PubKey: pk}
data, _ := json.Marshal(w)
// {"pubKey":"0x02..."}
```

Unmarshaling accepts both compressed and uncompressed formats.

## Example: Full Workflow

```go
package main

import (
    "fmt"
    "github.com/voltaire-labs/voltaire-go/primitives/publickey"
)

func main() {
    // Parse compressed public key
    pk, err := publickey.FromHex("0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")
    if err != nil {
        panic(err)
    }

    // Get different representations
    fmt.Printf("Compressed: %s\n", pk.HexCompressed())
    fmt.Printf("Uncompressed: %s\n", pk.Hex())

    // Derive address
    addr := pk.Address()
    fmt.Printf("Address: %s\n", addr.ChecksumHex())

    // Check validity
    if pk.IsValid() {
        fmt.Println("Valid public key")
    }
}
```

## Errors

- `ErrInvalidLength` - Input not 33, 64, or 65 bytes
- `ErrInvalidPrefix` - Compressed key prefix not 0x02 or 0x03
- `ErrInvalidPoint` - Point not on secp256k1 curve
- `ErrInvalidHex` - Invalid hex characters
