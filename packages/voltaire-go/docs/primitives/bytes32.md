---
title: Bytes32
description: Fixed 32-byte array type for hashes, storage keys, and arbitrary data
---

# Bytes32

The `bytes32` package provides a type-safe 32-byte array implementation commonly used
for hashes, storage keys, and other fixed-size data in Ethereum.

## Type Definition

```go
type Bytes32 [32]byte
```

## Creating Bytes32

### FromHex

Parse from a hex string:

```go
b, err := bytes32.FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
if err != nil {
    // Handle error
}
```

### FromBytes

Create from a 32-byte slice:

```go
data := make([]byte, 32)
b, err := bytes32.FromBytes(data)
```

### MustFromHex

Parse with panic on error (for constants):

```go
var MyKey = bytes32.MustFromHex("0x0000000000000000000000000000000000000000000000000000000000000001")
```

## Methods

### Hex / String

```go
b.Hex()    // "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
b.String() // same as Hex()
```

### Bytes

```go
slice := b.Bytes() // []byte
```

### IsZero / Equal / Compare

```go
if b.IsZero() {
    // All bytes are zero
}

if b.Equal(other) {
    // Bytes are equal
}

cmp := b.Compare(other) // -1, 0, or 1
```

## Constants

```go
var Zero Bytes32 // all zeros
```

## JSON Marshaling

Bytes32 marshals to lowercase hex strings with 0x prefix:

```go
type StorageSlot struct {
    Key   bytes32.Bytes32 `json:"key"`
    Value bytes32.Bytes32 `json:"value"`
}

slot := StorageSlot{Key: key, Value: value}
data, _ := json.Marshal(slot)
// {"key":"0x0000...0001","value":"0x0000...0000"}
```

## Errors

- `ErrInvalidHex` - Invalid hex characters
- `ErrInvalidLength` - Not exactly 32 bytes (64 hex chars)
