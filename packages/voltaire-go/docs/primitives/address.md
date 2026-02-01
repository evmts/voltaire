---
title: Address
description: Ethereum address type with EIP-55 checksum support
---

# Address

The `address` package provides a type-safe Ethereum address implementation with
EIP-55 checksum validation.

## Type Definition

```go
type Address [20]byte
```

## Creating Addresses

### FromHex

Parse an address from a hex string:

```go
addr, err := address.FromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
if err != nil {
    // Handle error
}
```

### FromBytes

Create from a 20-byte slice:

```go
bytes := make([]byte, 20)
addr, err := address.FromBytes(bytes)
```

### FromPublicKey

Derive from an uncompressed public key:

```go
pubKey := []byte{...} // 64 bytes
addr, err := address.FromPublicKey(pubKey)
```

## Methods

### Hex / ChecksumHex

```go
addr.Hex()         // "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
addr.ChecksumHex() // "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

### IsZero / Equal / Compare

```go
if addr.IsZero() {
    // Zero address
}

if addr.Equal(other) {
    // Addresses are equal
}

cmp := addr.Compare(other) // -1, 0, or 1
```

## Checksum Validation

```go
valid := address.ValidateChecksum("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
// true

valid := address.ValidateChecksum("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
// false (all lowercase)
```

## JSON Marshaling

Addresses marshal to checksummed hex strings:

```go
type Transfer struct {
    To address.Address `json:"to"`
}

t := Transfer{To: addr}
data, _ := json.Marshal(t)
// {"to":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}
```

## Errors

- `ErrInvalidHex` - Invalid hex characters
- `ErrInvalidLength` - Not exactly 20 bytes
- `ErrInvalidChecksum` - Checksum validation failed
