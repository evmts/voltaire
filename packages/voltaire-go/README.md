# voltaire-go

Go bindings for the [Voltaire](https://github.com/voltaire-labs/voltaire) Ethereum primitives library.

## Requirements

- Go 1.21+
- Zig 0.15+ (to build native library)

## Installation

```bash
# Build the native library first
cd ../.. && zig build build-ts-native

# Then use the Go package
go get github.com/voltaire-labs/voltaire-go
```

## Quick Start

```go
package main

import (
    "fmt"

    "github.com/voltaire-labs/voltaire-go/primitives/address"
    "github.com/voltaire-labs/voltaire-go/crypto/keccak256"
)

func main() {
    // Parse address
    addr, _ := address.FromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
    fmt.Println(addr.ChecksumHex()) // 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

    // Hash data
    hash := keccak256.HashString("hello")
    fmt.Println(hash.Hex())
}
```

## Packages

### Primitives

- `primitives/address` - Ethereum addresses with EIP-55 checksum
- `primitives/hash` - 32-byte hash values
- `primitives/hex` - Hex encoding utilities
- `primitives/u256` - 256-bit unsigned integers

### Cryptography

- `crypto/keccak256` - Keccak-256 hashing
- `crypto/sha256` - SHA-256 hashing

## Development

```bash
# Build
make build

# Test
make test

# Quick test (skip native rebuild)
make test-quick
```

## License

MIT
