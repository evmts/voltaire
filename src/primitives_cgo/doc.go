// Package primitives_cgo provides CGO bindings to the Zig primitives library.
//
// This package wraps the Zig primitives library via CGO, providing direct access
// to the high-performance Zig implementation of Ethereum primitive types and
// operations through the C API.
//
// # Overview
//
// The primitives_cgo package is built on top of a high-performance Zig implementation
// that provides cryptographically secure and memory-safe operations for Ethereum
// data structures. The Go bindings use CGO to interface with the compiled C API.
//
// # Core Types
//
// The package provides the following core types:
//
//   - Address: Ethereum addresses (20 bytes) with EIP-55 checksumming
//   - Hash: 32-byte hash values (Keccak-256, etc.)
//   - U256: 256-bit unsigned integers
//
// # Features
//
//   - Address operations with EIP-55 checksumming
//   - Keccak-256 hashing (compatible with ethereum.org/x/crypto/sha3)
//   - Hexadecimal encoding/decoding with 0x prefix handling
//   - EIP-191 personal message signing
//   - CREATE/CREATE2 contract address calculation
//   - RLP encoding/decoding (via Zig implementation)
//   - ABI encoding/decoding (via Zig implementation)
//
// # Usage
//
// Basic address operations:
//
//	import "github.com/evmts/primitives/src/primitives_cgo"
//
//	// Parse an address from hex
//	addr, err := primitives_cgo.AddressFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
//	if err != nil {
//	    log.Fatal(err)
//	}
//
//	// Convert to checksummed hex
//	checksummed, err := addr.ToChecksumHex()
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Println(checksummed) // 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0
//
//	// Validate checksum
//	valid := primitives_cgo.ValidateChecksum(checksummed)
//	fmt.Println(valid) // true
//
// Hashing operations:
//
//	// Compute Keccak-256 hash
//	data := []byte("hello world")
//	hash, err := primitives_cgo.Keccak256(data)
//	if err != nil {
//	    log.Fatal(err)
//	}
//
//	// Convert hash to hex
//	hashHex, err := hash.ToHex()
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Println(hashHex) // 0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad
//
// EIP-191 personal message signing:
//
//	// Hash a message for signing
//	message := []byte("Hello, Ethereum!")
//	messageHash, err := primitives_cgo.EIP191HashMessage(message)
//	if err != nil {
//	    log.Fatal(err)
//	}
//
// Contract address calculation:
//
//	// Calculate CREATE contract address
//	sender, _ := primitives_cgo.AddressFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0")
//	nonce := uint64(0)
//	contractAddr, err := primitives_cgo.CalculateCreateAddress(sender, nonce)
//	if err != nil {
//	    log.Fatal(err)
//	}
//
// # Building
//
// This package requires the Zig primitives library to be built first:
//
//	zig build
//
// This will compile the C API library (libprimitives_c) and place it in
// zig-out/lib/ with the header in zig-out/include/primitives.h.
//
// # CGO Requirements
//
// This package uses CGO and requires:
//   - A C compiler (gcc, clang, etc.)
//   - The libprimitives_c library (built via zig build)
//   - The primitives.h header file
//
// The CGO directives in cgo_bindings.go automatically configure the include
// and library paths relative to the zig-out directory.
//
// # Performance
//
// The underlying Zig implementation is highly optimized and uses:
//   - SIMD acceleration where available
//   - Constant-time cryptographic operations
//   - Zero-copy operations where possible
//   - Memory pooling and efficient allocators
//
// CGO overhead is minimal as the Go wrappers make direct C function calls
// without additional marshaling beyond what's necessary for type safety.
//
// # Security
//
// This is mission-critical cryptographic infrastructure. All operations are
// designed to be:
//   - Memory-safe (no buffer overflows, use-after-free, etc.)
//   - Constant-time where required (preventing timing attacks)
//   - Fuzz-tested against malformed inputs
//   - Cross-validated against reference implementations
//
// # Testing
//
// Run the Go tests with:
//
//	go test ./src/primitives_cgo/...
//
// Run the full Zig test suite with:
//
//	zig build test
//
// # Thread Safety
//
// All functions in this package are thread-safe and can be called concurrently
// from multiple goroutines. Each function call is independent and does not
// share mutable state.
package primitives_cgo
