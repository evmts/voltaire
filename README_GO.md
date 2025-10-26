# Go Bindings for Ethereum Primitives

This document provides Go-specific documentation for using the Ethereum primitives library with Go.

## Overview

The Go bindings provide idiomatic Go interfaces to the high-performance Zig primitives library through CGO. This gives you access to cryptographically secure Ethereum operations with minimal overhead.

## Features

- **Address Operations**: Parse, validate, and format Ethereum addresses with EIP-55 checksumming
- **Keccak-256 Hashing**: Ethereum-compatible Keccak-256 implementation
- **Hexadecimal Utilities**: Convert between bytes and hex strings with 0x prefix handling
- **U256 Operations**: 256-bit unsigned integer support
- **EIP-191**: Personal message signing format
- **Contract Addresses**: Calculate CREATE and CREATE2 contract addresses
- **Thread-Safe**: All operations are safe for concurrent use
- **Constant-Time Crypto**: Timing-attack resistant operations

## Installation

### Prerequisites

1. **Zig Compiler** (0.15.1 or later)
   ```bash
   # Install Zig from https://ziglang.org/download/
   # Or use your package manager
   brew install zig  # macOS
   ```

2. **C Compiler** (required for CGO)
   - macOS: Xcode Command Line Tools
   - Linux: gcc or clang
   - Windows: MinGW or MSVC

3. **Go** (1.22 or later)
   ```bash
   go version
   ```

### Building the C Library

Before using the Go bindings, you must build the Zig library:

```bash
# From the repository root
zig build

# This creates:
# - zig-out/lib/libprimitives_c.a (static library)
# - zig-out/lib/libprimitives_c.dylib (dynamic library, macOS)
# - zig-out/lib/libprimitives_c.so (dynamic library, Linux)
# - zig-out/include/primitives.h (C header)
```

### Installing Go Dependencies

```bash
go mod download
```

Or using the Zig build system:

```bash
zig build go
```

## Usage

### Importing

```go
import (
    "github.com/evmts/primitives/src/primitives"
    "github.com/evmts/primitives/src/crypto"
)
```

### Address Operations

```go
package main

import (
    "fmt"
    "log"
    "github.com/evmts/primitives/src/primitives"
)

func main() {
    // Parse address from hex
    addr, err := primitives.AddressFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
    if err != nil {
        log.Fatal(err)
    }

    // Convert to hex (lowercase)
    hex, err := addr.ToHex()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(hex) // 0x742d35cc6634c0532925a3b844bc9e7595f0beb0

    // Convert to checksummed hex (EIP-55)
    checksummed, err := addr.ToChecksumHex()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(checksummed) // 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0

    // Validate checksum
    valid := primitives.ValidateChecksum(checksummed)
    fmt.Println(valid) // true

    // Check if zero address
    if addr.IsZero() {
        fmt.Println("Zero address")
    }

    // Compare addresses
    addr2, _ := primitives.AddressFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
    if addr.Equals(addr2) {
        fmt.Println("Addresses are equal")
    }
}
```

### Hashing Operations

```go
package main

import (
    "fmt"
    "log"
    "github.com/evmts/primitives/src/primitives"
)

func main() {
    // Compute Keccak-256 hash
    data := []byte("hello world")
    hash, err := primitives.Keccak256(data)
    if err != nil {
        log.Fatal(err)
    }

    // Convert to hex
    hashHex, err := hash.ToHex()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(hashHex)
    // 0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad

    // Parse hash from hex
    hash2, err := primitives.HashFromHex(hashHex)
    if err != nil {
        log.Fatal(err)
    }

    // Compare hashes (constant-time)
    if hash.Equals(hash2) {
        fmt.Println("Hashes are equal")
    }
}
```

### EIP-191 Personal Message Signing

```go
package main

import (
    "fmt"
    "log"
    "github.com/evmts/primitives/src/primitives"
)

func main() {
    // Hash a message for signing
    message := []byte("Hello, Ethereum!")
    messageHash, err := primitives.EIP191HashMessage(message)
    if err != nil {
        log.Fatal(err)
    }

    hashHex, _ := messageHash.ToHex()
    fmt.Println("Message hash:", hashHex)
    // This hash can now be signed with a private key
}
```

### Contract Address Calculation

```go
package main

import (
    "fmt"
    "log"
    "github.com/evmts/primitives/src/primitives"
)

func main() {
    // Calculate CREATE contract address
    sender, err := primitives.AddressFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
    if err != nil {
        log.Fatal(err)
    }

    nonce := uint64(0)
    contractAddr, err := primitives.CalculateCreateAddress(sender, nonce)
    if err != nil {
        log.Fatal(err)
    }

    addrHex, _ := contractAddr.ToHex()
    fmt.Println("Contract address:", addrHex)
}
```

### Hexadecimal Utilities

```go
package main

import (
    "fmt"
    "log"
    "github.com/evmts/primitives/src/primitives"
)

func main() {
    // Convert hex to bytes
    hex := "0xdeadbeef"
    bytes, err := primitives.HexToBytes(hex)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Bytes: %x\n", bytes) // deadbeef

    // Convert bytes to hex
    data := []byte{0xca, 0xfe, 0xba, 0xbe}
    hexStr, err := primitives.BytesToHex(data)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(hexStr) // 0xcafebabe
}
```

### U256 Operations

```go
package main

import (
    "fmt"
    "log"
    "github.com/evmts/primitives/src/primitives"
)

func main() {
    // Parse U256 from hex
    value, err := primitives.U256FromHex("0x1234567890abcdef")
    if err != nil {
        log.Fatal(err)
    }

    // Convert to hex
    hexStr, err := value.ToHex()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(hexStr) // 0x000000000000000000000000000000000000000000000000001234567890abcdef
}
```

### Version Information

```go
package main

import (
    "fmt"
    "github.com/evmts/primitives/src/primitives"
)

func main() {
    version := primitives.Version()
    fmt.Println("Library version:", version)
}
```

## Building and Testing

### Building Go Packages

```bash
# Build Go packages (requires Zig library to be built first)
zig build build-go

# Or directly with Go
go build ./src/primitives
go build ./src/crypto
```

### Running Tests

```bash
# Run Go tests (requires Zig library to be built first)
zig build test-go

# Or directly with Go
go test -v ./src/primitives/...
go test -v ./src/crypto/...
```

### Running All Tests

```bash
# Build Zig library and run all tests (Zig + Go)
zig build
zig build test       # Zig tests
zig build test-go    # Go tests
```

## CGO Configuration

The CGO directives in `src/cgo_bindings.go` automatically configure the build:

```go
// #cgo CFLAGS: -I${SRCDIR}/../zig-out/include
// #cgo LDFLAGS: -L${SRCDIR}/../zig-out/lib -lprimitives_c
```

This means:
- Include path points to `zig-out/include/` for `primitives.h`
- Library path points to `zig-out/lib/` for `libprimitives_c.a` or `.dylib`

### Static vs Dynamic Linking

By default, Go will use static linking if available. The build produces both:
- **Static**: `libprimitives_c.a` (portable, no runtime dependencies)
- **Dynamic**: `libprimitives_c.dylib` (macOS) or `.so` (Linux)

To force dynamic linking:
```bash
CGO_LDFLAGS="-L./zig-out/lib -lprimitives_c" go build ./src/...
```

## Integration Patterns

### Using with Standard Library

The primitives work well with Go's standard library:

```go
import (
    "encoding/hex"
    "github.com/evmts/primitives/src/primitives"
)

// Convert primitives.Hash to standard Go hex encoding
func hashToStdHex(hash primitives.Hash) string {
    return "0x" + hex.EncodeToString(hash[:])
}

// Parse from standard Go hex
func stdHexToHash(s string) (primitives.Hash, error) {
    // Remove 0x prefix if present
    if len(s) >= 2 && s[0:2] == "0x" {
        s = s[2:]
    }
    var hash primitives.Hash
    bytes, err := hex.DecodeString(s)
    if err != nil {
        return hash, err
    }
    copy(hash[:], bytes)
    return hash, nil
}
```

### Using with golang.org/x/crypto

The Keccak-256 implementation is compatible with `golang.org/x/crypto/sha3`:

```go
import (
    "golang.org/x/crypto/sha3"
    "github.com/evmts/primitives/src/primitives"
)

func compareKeccak(data []byte) {
    // Using primitives (via Zig)
    hash1, _ := primitives.Keccak256(data)

    // Using golang.org/x/crypto
    hash2 := sha3.NewLegacyKeccak256()
    hash2.Write(data)
    stdHash := hash2.Sum(nil)

    // These should match
    for i := 0; i < 32; i++ {
        if hash1[i] != stdHash[i] {
            panic("Hashes don't match!")
        }
    }
}
```

## Performance Considerations

### CGO Overhead

CGO calls have overhead (~10-50ns per call). For best performance:
- Batch operations when possible
- Profile your code to identify hotspots
- Consider the Zig library directly for high-performance scenarios

### Memory Management

The Go bindings handle memory automatically:
- Go allocates buffers for return values
- C library uses stack allocation where possible
- No manual memory management required

### Benchmarking

```go
func BenchmarkKeccak256(b *testing.B) {
    data := make([]byte, 1024)
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, _ = primitives.Keccak256(data)
    }
}
```

## Security Considerations

### Constant-Time Operations

All cryptographic comparisons use constant-time operations:

```go
// CORRECT - constant time
if hash1.Equals(hash2) {
    // hashes are equal
}

// WRONG - variable time, leaks timing info
import "bytes"
if bytes.Equal(hash1[:], hash2[:]) {
    // DON'T DO THIS for crypto
}
```

### Error Handling

Always check errors from cryptographic operations:

```go
hash, err := primitives.Keccak256(data)
if err != nil {
    // Handle error - don't ignore it!
    log.Fatal("Keccak-256 failed:", err)
}
```

### Input Validation

The library validates all inputs:
- Invalid hex strings return errors
- Out-of-range values return errors
- Malformed addresses return errors

Never ignore these errors - they indicate security-relevant problems.

## Troubleshooting

### CGO Errors

If you see CGO compilation errors:

1. Ensure the Zig library is built: `zig build`
2. Check that `zig-out/lib/libprimitives_c.a` exists
3. Check that `zig-out/include/primitives.h` exists
4. Verify your C compiler is installed and working

### Library Not Found

If you see "library not found" errors:

```bash
# Check library exists
ls -la zig-out/lib/libprimitives_c.*

# If missing, rebuild
zig build
```

### Symbol Not Found (macOS)

If you see symbol errors on macOS, you may need to rebuild for your architecture:

```bash
# For Apple Silicon (M1/M2)
zig build -Dtarget=aarch64-macos

# For Intel Macs
zig build -Dtarget=x86_64-macos
```

## Examples

See the examples in the repository:
- `examples/go/address.go` - Address operations
- `examples/go/hash.go` - Hashing operations
- `examples/go/hex.go` - Hex utilities

## API Reference

### Types

- `Address`: 20-byte Ethereum address
- `Hash`: 32-byte hash value
- `U256`: 32-byte big-endian 256-bit unsigned integer

### Functions

#### Address Operations
- `AddressFromHex(hex string) (Address, error)`
- `(a Address) ToHex() (string, error)`
- `(a Address) ToChecksumHex() (string, error)`
- `(a Address) IsZero() bool`
- `(a Address) Equals(other Address) bool`
- `ValidateChecksum(hex string) bool`

#### Hashing
- `Keccak256(data []byte) (Hash, error)`
- `(h Hash) ToHex() (string, error)`
- `HashFromHex(hex string) (Hash, error)`
- `(h Hash) Equals(other Hash) bool`

#### Hex Utilities
- `HexToBytes(hex string) ([]byte, error)`
- `BytesToHex(data []byte) (string, error)`

#### U256
- `U256FromHex(hex string) (U256, error)`
- `(u U256) ToHex() (string, error)`

#### EIP-191
- `EIP191HashMessage(message []byte) (Hash, error)`

#### Contract Addresses
- `CalculateCreateAddress(sender Address, nonce uint64) (Address, error)`

#### Version
- `Version() string`

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing

See CONTRIBUTING.md for guidelines on contributing to this project.

## Support

For issues and questions:
- GitHub Issues: https://github.com/evmts/primitives/issues
- Documentation: See the main README.md

## Resources

- Zig Documentation: https://ziglang.org/documentation/
- Ethereum Yellow Paper: https://ethereum.github.io/yellowpaper/paper.pdf
- EIP-55 (Checksummed addresses): https://eips.ethereum.org/EIPS/eip-55
- EIP-191 (Personal messages): https://eips.ethereum.org/EIPS/eip-191
