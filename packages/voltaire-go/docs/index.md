---
title: voltaire-go
description: Go bindings for Voltaire Ethereum primitives
---

# voltaire-go

Idiomatic Go bindings for the Voltaire Ethereum primitives library.

## Overview

voltaire-go provides type-safe, performant Go wrappers around Voltaire's core
primitives. The library uses CGO to call into the native Zig/C library for
maximum performance.

## Features

- **Type-safe primitives**: Address, Hash, U256 with proper Go idioms
- **Efficient hashing**: Keccak-256, SHA-256, RIPEMD-160, Blake2b
- **JSON/Text marshaling**: All types implement standard Go interfaces
- **Zero dependencies**: Only requires the native voltaire library

## Installation

```bash
go get github.com/voltaire-labs/voltaire-go
```

## Quick Start

```go
import (
    "github.com/voltaire-labs/voltaire-go/primitives/address"
    "github.com/voltaire-labs/voltaire-go/crypto/keccak256"
)

func main() {
    // Parse and validate address
    addr, err := address.FromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
    if err != nil {
        panic(err)
    }

    // Get checksummed representation
    fmt.Println(addr.ChecksumHex())

    // Hash data
    hash := keccak256.Hash([]byte("hello world"))
    fmt.Println(hash.Hex())
}
```

## Package Structure

```
voltaire-go/
├── primitives/
│   ├── address/    # Ethereum addresses
│   ├── hash/       # 32-byte hashes
│   ├── hex/        # Hex encoding
│   └── u256/       # 256-bit integers
├── crypto/
│   ├── keccak256/  # Keccak-256
│   └── sha256/     # SHA-256
└── internal/
    └── ffi/        # CGO bindings
```
