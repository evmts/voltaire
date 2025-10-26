package crypto

/*
#cgo CFLAGS: -I../../zig-out/include
#cgo LDFLAGS: -L../../zig-out/lib -lprimitives_c
#include "primitives.h"
*/
import "C"
import (
	"errors"
	"fmt"
	"unsafe"
)

// SECURITY CRITICAL: secp256k1 signature operations
// All operations must validate inputs and reject malleable signatures (EIP-2)

// Signature component sizes (bytes)
const (
	PrivateKeySize = 32
	PublicKeySize  = 64 // uncompressed (x || y)
	MessageHashSize = 32
	SignatureRSize = 32
	SignatureSSize = 32
)

var (
	ErrInvalidPrivateKey = errors.New("invalid private key")
	ErrInvalidSignature  = errors.New("invalid signature")
	ErrInvalidRecoveryID = errors.New("invalid recovery ID")
	ErrInvalidPublicKey  = errors.New("invalid public key")
)

// RecoverPublicKey recovers the 64-byte uncompressed public key from an ECDSA signature.
//
// SECURITY CRITICAL: This function:
// - Validates signature components (r, s in valid range)
// - Rejects malleable signatures (s > n/2 per EIP-2)
// - Handles both recovery ID formats (0-1 and 27-28)
//
// Parameters:
//   - messageHash: 32-byte Keccak-256 hash of the message
//   - r: 32-byte r component of signature
//   - s: 32-byte s component of signature
//   - v: recovery ID (0-1) or Ethereum v (27-28)
//
// Returns:
//   - [64]byte: Uncompressed public key (x || y coordinates)
//   - error: ErrInvalidSignature if signature is invalid
func RecoverPublicKey(messageHash, r, s [32]byte, v byte) ([64]byte, error) {
	var pubkey [64]byte

	// Call C function
	result := C.primitives_secp256k1_recover_pubkey(
		(*C.uint8_t)(unsafe.Pointer(&messageHash[0])),
		(*C.uint8_t)(unsafe.Pointer(&r[0])),
		(*C.uint8_t)(unsafe.Pointer(&s[0])),
		C.uint8_t(v),
		(*C.uint8_t)(unsafe.Pointer(&pubkey[0])),
	)

	if result != C.PRIMITIVES_SUCCESS {
		return pubkey, ErrInvalidSignature
	}

	return pubkey, nil
}

// RecoverAddress recovers the Ethereum address from an ECDSA signature.
//
// SECURITY CRITICAL: This function:
// - Validates signature components
// - Rejects malleable signatures
// - Derives address from recovered public key using Keccak-256
//
// Parameters:
//   - messageHash: 32-byte Keccak-256 hash of the message
//   - r: 32-byte r component of signature
//   - s: 32-byte s component of signature
//   - v: recovery ID (0-1)
//
// Returns:
//   - [20]byte: Ethereum address
//   - error: ErrInvalidSignature if signature is invalid
func RecoverAddress(messageHash, r, s [32]byte, v byte) ([20]byte, error) {
	var address [20]byte

	// Ensure v is in 0-1 range (not 27-28)
	recoveryID := v
	if v >= 27 && v <= 28 {
		recoveryID = v - 27
	} else if v > 1 {
		return address, ErrInvalidRecoveryID
	}

	// Prepare C structures
	var cAddress C.PrimitivesAddress

	// Call C function
	result := C.primitives_secp256k1_recover_address(
		(*C.uint8_t)(unsafe.Pointer(&messageHash[0])),
		(*C.uint8_t)(unsafe.Pointer(&r[0])),
		(*C.uint8_t)(unsafe.Pointer(&s[0])),
		C.uint8_t(recoveryID),
		&cAddress,
	)

	if result != C.PRIMITIVES_SUCCESS {
		return address, ErrInvalidSignature
	}

	// Copy result to Go array
	copy(address[:], C.GoBytes(unsafe.Pointer(&cAddress.bytes[0]), 20))

	return address, nil
}

// PublicKeyFromPrivate derives the public key from a private key.
//
// SECURITY: Private keys must be kept secret. This function is provided
// for key derivation but should be used carefully.
//
// Parameters:
//   - privateKey: 32-byte private key
//
// Returns:
//   - [64]byte: Uncompressed public key (x || y coordinates)
//   - error: ErrInvalidPrivateKey if private key is invalid
func PublicKeyFromPrivate(privateKey [32]byte) ([64]byte, error) {
	var pubkey [64]byte

	// Call C function
	result := C.primitives_secp256k1_pubkey_from_private(
		(*C.uint8_t)(unsafe.Pointer(&privateKey[0])),
		(*C.uint8_t)(unsafe.Pointer(&pubkey[0])),
	)

	if result != C.PRIMITIVES_SUCCESS {
		return pubkey, ErrInvalidPrivateKey
	}

	return pubkey, nil
}

// ValidateSignature validates ECDSA signature components.
//
// Checks that:
// - r is in range [1, n-1]
// - s is in range [1, n-1]
// - s <= n/2 (EIP-2 malleability protection)
//
// Parameters:
//   - r: 32-byte r component
//   - s: 32-byte s component
//
// Returns:
//   - bool: true if signature is valid, false otherwise
func ValidateSignature(r, s [32]byte) bool {
	result := C.primitives_secp256k1_validate_signature(
		(*C.uint8_t)(unsafe.Pointer(&r[0])),
		(*C.uint8_t)(unsafe.Pointer(&s[0])),
	)

	return bool(result)
}

// PublicKeyToAddress derives an Ethereum address from a public key.
//
// The address is computed as the last 20 bytes of Keccak256(pubkey).
//
// Parameters:
//   - pubkey: 64-byte uncompressed public key (x || y)
//
// Returns:
//   - [20]byte: Ethereum address
func PublicKeyToAddress(pubkey [64]byte) [20]byte {
	// Hash the public key with Keccak-256
	hash := Keccak256(pubkey[:])

	// Return last 20 bytes
	var address [20]byte
	copy(address[:], hash[12:])

	return address
}

// SecureZero securely zeroes sensitive data in memory.
//
// SECURITY CRITICAL: Use this to clear private keys and other
// sensitive data from memory after use.
//
// Parameters:
//   - data: Slice to zero
func SecureZero(data []byte) {
	if len(data) == 0 {
		return
	}

	// Volatile write to prevent compiler optimization
	// Using loop instead of memset to ensure it's not optimized away
	for i := range data {
		data[i] = 0
	}

	// Force memory barrier (prevents reordering)
	// In Go, this is implicit through the slice write
}

// SignatureFromBytes parses a 65-byte signature into components.
//
// Format: [r (32 bytes)] [s (32 bytes)] [v (1 byte)]
//
// Parameters:
//   - sig: 65-byte signature
//
// Returns:
//   - r: 32-byte r component
//   - s: 32-byte s component
//   - v: recovery ID or Ethereum v value
//   - error: if signature length is invalid
func SignatureFromBytes(sig []byte) (r, s [32]byte, v byte, err error) {
	if len(sig) != 65 {
		err = fmt.Errorf("invalid signature length: expected 65, got %d", len(sig))
		return
	}

	copy(r[:], sig[0:32])
	copy(s[:], sig[32:64])
	v = sig[64]

	return
}

// SignatureToBytes serializes signature components to bytes.
//
// Format: [r (32 bytes)] [s (32 bytes)] [v (1 byte)]
//
// Parameters:
//   - r: 32-byte r component
//   - s: 32-byte s component
//   - v: recovery ID or Ethereum v value
//
// Returns:
//   - [65]byte: Serialized signature
func SignatureToBytes(r, s [32]byte, v byte) [65]byte {
	var sig [65]byte
	copy(sig[0:32], r[:])
	copy(sig[32:64], s[:])
	sig[64] = v
	return sig
}
