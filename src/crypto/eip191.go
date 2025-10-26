package crypto

/*
#cgo CFLAGS: -I../../zig-out/include
#cgo LDFLAGS: -L../../zig-out/lib -lprimitives_c -Wl,-rpath,${SRCDIR}/../../zig-out/lib
#include "primitives.h"
*/
import "C"
import (
	"fmt"
	"unsafe"
)

// HashPersonalMessage hashes a message using EIP-191 personal message format
//
// EIP-191 defines a standard for signing arbitrary messages on Ethereum.
// The personal message format prepends the message with:
//   "\x19Ethereum Signed Message:\n{length}{message}"
// before hashing with Keccak-256.
//
// This prevents signed messages from being valid Ethereum transactions,
// protecting users from signing malicious transaction data.
//
// SECURITY CRITICAL: The prefix must be exactly as specified in EIP-191
// to ensure compatibility and security.
//
// Parameters:
//   - message: The message to hash (as raw bytes)
//
// Returns:
//   - [32]byte: Keccak-256 hash of the formatted message
//
// Example:
//   message := []byte("hello")
//   hash := HashPersonalMessage(message)
//   // hash is keccak256("\x19Ethereum Signed Message:\n5hello")
func HashPersonalMessage(message []byte) [32]byte {
	var hash [32]byte

	// Prepare C structures
	var cHash C.PrimitivesHash

	// Handle empty message case
	messagePtr := (*C.uint8_t)(nil)
	messageLen := C.size_t(0)
	if len(message) > 0 {
		messagePtr = (*C.uint8_t)(unsafe.Pointer(&message[0]))
		messageLen = C.size_t(len(message))
	}

	// Call C function
	result := C.primitives_eip191_hash_message(
		messagePtr,
		messageLen,
		&cHash,
	)

	if result != C.PRIMITIVES_SUCCESS {
		// This should never happen with valid input
		panic(fmt.Sprintf("eip191_hash_message failed with error code: %d", result))
	}

	// Copy result to Go array
	copy(hash[:], C.GoBytes(unsafe.Pointer(&cHash.bytes[0]), 32))

	return hash
}

// HashPersonalMessageHex is a convenience function that returns the hex-encoded hash
func HashPersonalMessageHex(message []byte) string {
	hash := HashPersonalMessage(message)
	return HashToHex(hash)
}

// HashPersonalMessageString hashes a UTF-8 string message
func HashPersonalMessageString(message string) [32]byte {
	return HashPersonalMessage([]byte(message))
}

// HashPersonalMessageStringHex hashes a UTF-8 string and returns hex
func HashPersonalMessageStringHex(message string) string {
	hash := HashPersonalMessageString(message)
	return HashToHex(hash)
}
