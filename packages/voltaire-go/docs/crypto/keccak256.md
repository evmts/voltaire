---
title: Keccak-256
description: Ethereum's primary hash function
---

# Keccak-256

The `keccak256` package provides Keccak-256 hashing, the primary hash function
used in Ethereum for addresses, signatures, and state roots.

## Basic Usage

### Hash Bytes

```go
import "github.com/voltaire-labs/voltaire-go/crypto/keccak256"

data := []byte("hello world")
hash := keccak256.Hash(data)
fmt.Println(hash.Hex())
```

### Hash String

```go
hash := keccak256.HashString("hello")
// 0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8
```

### Hash Multiple Slices

```go
hash := keccak256.Sum(
    []byte("hello"),
    []byte(" "),
    []byte("world"),
)
// Same as Hash([]byte("hello world"))
```

## Common Use Cases

### Function Selector

```go
// Get first 4 bytes of keccak256("transfer(address,uint256)")
hash := keccak256.HashString("transfer(address,uint256)")
selector := hash.Bytes()[:4]
// [0xa9, 0x05, 0x9c, 0xbb]
```

### Event Topic

```go
hash := keccak256.HashString("Transfer(address,address,uint256)")
topic := hash.Hex()
// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

### Address from Public Key

```go
// Hash public key, take last 20 bytes
pubKey := []byte{...} // 64 bytes (uncompressed, no prefix)
hash := keccak256.Hash(pubKey)
address := hash.Bytes()[12:32]
```

## Test Vectors

| Input | Keccak-256 |
|-------|------------|
| "" (empty) | 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470 |
| "hello" | 0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8 |
