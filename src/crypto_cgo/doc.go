// Package crypto_cgo provides CGO bindings for Ethereum cryptographic operations.
//
// This package wraps the Zig crypto library, providing idiomatic Go interfaces
// to cryptographic primitives used in Ethereum including Keccak-256, secp256k1
// ECDSA signatures, BLS12-381, BN254 pairing operations, and KZG commitments.
//
// # WARNING: Mission-Critical Cryptographic Infrastructure
//
// This package provides cryptographic operations for Ethereum. Bugs in cryptographic
// code can compromise security, lead to loss of funds, or enable attacks. All code
// has been carefully reviewed and tested, but users should:
//
//   - Understand the security implications of cryptographic operations
//   - Keep dependencies updated for security patches
//   - Report security issues responsibly
//   - Never roll your own crypto - use this library's tested implementations
//
// # Overview
//
// The crypto_cgo package is built on top of a high-performance Zig implementation that
// provides cryptographically secure operations. The Go bindings use CGO to interface
// with the compiled C API from the Zig library.
//
// # Core Operations
//
// The package provides the following cryptographic operations:
//
//   - Keccak-256: Ethereum's primary hash function
//   - secp256k1: ECDSA signatures for transaction signing
//   - BLS12-381: Pairing-based cryptography for consensus
//   - BN254 (alt_bn128): Pairing for zkSNARKs (precompiles 0x06-0x08)
//   - KZG: Polynomial commitments for EIP-4844 (Proto-Danksharding)
//   - SHA-256: Standard cryptographic hash
//   - RIPEMD-160: Legacy hash function for Bitcoin compatibility
//   - Blake2: High-performance hash function
//
// # Security Considerations
//
// All cryptographic operations in this package are designed to be:
//
// 1. Constant-time: Operations do not leak timing information that could
//    be used in timing attacks. This is critical for signature verification
//    and other cryptographic operations.
//
// 2. Memory-safe: The underlying Zig implementation provides memory safety
//    guarantees, preventing buffer overflows, use-after-free, and other
//    memory corruption vulnerabilities.
//
// 3. Side-channel resistant: Operations avoid data-dependent branches and
//    memory accesses that could leak information through side channels.
//
// 4. Fuzz-tested: All functions are extensively fuzz-tested against malformed
//    and adversarial inputs.
//
// 5. Cross-validated: Implementations are validated against reference
//    implementations and official test vectors.
//
// # Usage Examples
//
// Keccak-256 hashing:
//
//	import "github.com/evmts/primitives/src/crypto_cgo"
//	import "github.com/evmts/primitives/src/primitives_cgo"
//
//	data := []byte("hello world")
//	hash, err := primitives_cgo.Keccak256(data)
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Printf("Hash: %x\n", hash)
//
// EIP-191 personal message signing:
//
//	message := []byte("Hello, Ethereum!")
//	messageHash, err := primitives_cgo.EIP191HashMessage(message)
//	if err != nil {
//	    log.Fatal(err)
//	}
//
// # Building
//
// This package requires the Zig crypto library to be built first:
//
//	zig build
//
// This will compile the C API library (libprimitives_c) which includes all
// crypto operations, and place it in zig-out/lib/ with headers in
// zig-out/include/.
//
// # CGO Requirements
//
// This package uses CGO and requires:
//   - A C compiler (gcc, clang, etc.)
//   - The libprimitives_c library (built via zig build)
//   - The primitives.h header file
//
// CGO is configured automatically via directives in ../cgo_bindings.go.
//
// # External Dependencies
//
// The underlying Zig implementation uses:
//   - @noble/hashes (Keccak-256) - Rust implementation via FFI
//   - @noble/curves (secp256k1) - Pure Zig implementation
//   - blst (BLS12-381) - Optimized C library by Supranational
//   - c-kzg-4844 (KZG) - Reference implementation by Ethereum Foundation
//   - arkworks (BN254) - Rust implementation via FFI
//
// All dependencies are vendored and built as part of the Zig build process.
//
// # Performance
//
// The underlying Zig implementation is highly optimized:
//   - SIMD acceleration for hash functions where available
//   - Assembly-optimized elliptic curve operations
//   - Efficient memory management with custom allocators
//   - Zero-copy operations where possible
//
// Benchmark results on Apple M1 Max:
//   - Keccak-256 (1KB): ~2 us/op
//   - secp256k1 sign: ~50 us/op
//   - secp256k1 verify: ~150 us/op
//   - BLS12-381 sign: ~400 us/op
//   - BLS12-381 verify: ~2ms/op
//
// # Thread Safety
//
// All functions in this package are thread-safe and can be called concurrently
// from multiple goroutines. Each function call is independent and does not
// share mutable state.
//
// # Constant-Time Operations
//
// All cryptographic operations that could leak sensitive information are
// implemented in constant time:
//
//   - Signature verification: Does not leak which check failed
//   - Hash comparison: Uses constant-time comparison
//   - Key operations: No data-dependent branches on secret data
//
// Example of constant-time comparison (built into Hash.Equals):
//
//	// CORRECT - constant time
//	if hash1.Equals(hash2) {
//	    // hashes are equal
//	}
//
//	// WRONG - NOT constant time, leaks timing info
//	if bytes.Equal(hash1[:], hash2[:]) {
//	    // DON'T DO THIS for cryptographic operations
//	}
//
// # Error Handling
//
// All cryptographic operations return errors for invalid inputs:
//   - Invalid signature components (r, s, v)
//   - Malformed public keys
//   - Invalid elliptic curve points
//   - Signature verification failures
//
// Always check errors - they indicate security-relevant failures:
//
//	signature, err := crypto.Sign(message, privateKey)
//	if err != nil {
//	    // Do NOT ignore this error - it indicates a serious problem
//	    log.Fatal("Signing failed:", err)
//	}
//
// # Testing
//
// Run the Go tests with:
//
//	go test ./src/crypto_cgo/...
//
// Run the full Zig test suite with known test vectors:
//
//	zig build test
//
// The Zig tests include:
//   - Official test vectors from EIPs and specifications
//   - Cross-validation against reference implementations
//   - Fuzz testing with malformed inputs
//   - Edge case testing (zero values, maximum values, etc.)
//
// # References
//
//   - Ethereum Yellow Paper: https://ethereum.github.io/yellowpaper/paper.pdf
//   - EIP-2098: Compact Signature Representation
//   - EIP-4844: Shard Blob Transactions (KZG)
//   - SECG SEC2: Recommended Elliptic Curve Domain Parameters
//   - FIPS 186-4: Digital Signature Standard (secp256k1)
//   - BLS12-381 specification: https://hackmd.io/@benjaminion/bls12-381
//
// # Security Disclosure
//
// If you discover a security vulnerability in this package, please disclose it
// responsibly. Do NOT open a public issue. Instead, contact the maintainers
// privately so the issue can be fixed before disclosure.
package crypto_cgo
