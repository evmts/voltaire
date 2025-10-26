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

// Keccak256Empty is the pre-computed empty Keccak-256 hash constant
// Hash of empty bytes: keccak256("")
const Keccak256Empty = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"

// Keccak256 computes the Keccak-256 hash of input data
// This is the primary hash function used in Ethereum
//
// SECURITY CRITICAL: This must produce correct hashes - incorrect output
// can lead to address collisions, signature verification failures, etc.
//
// Parameters:
//   - data: Input data to hash
//
// Returns:
//   - [32]byte: Keccak-256 hash
func Keccak256(data []byte) [32]byte {
	var hash [32]byte

	// Handle empty input by returning pre-computed hash
	if len(data) == 0 {
		// Convert constant to bytes
		for i := 0; i < 32; i++ {
			hash[i] = byte((hexToByte(Keccak256Empty[2+i*2])<<4) | hexToByte(Keccak256Empty[3+i*2]))
		}
		return hash
	}

	// Prepare C structures
	var cHash C.PrimitivesHash

	// Call C function
	// Note: We use &data[0] which is safe because we checked len(data) > 0
	result := C.primitives_keccak256(
		(*C.uint8_t)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
		&cHash,
	)

	if result != C.PRIMITIVES_SUCCESS {
		// This should never happen with valid input
		panic(fmt.Sprintf("keccak256 failed with error code: %d", result))
	}

	// Copy result to Go array
	copy(hash[:], C.GoBytes(unsafe.Pointer(&cHash.bytes[0]), 32))

	return hash
}

// Keccak256Hex computes Keccak-256 and returns hex string with 0x prefix
func Keccak256Hex(data []byte) string {
	hash := Keccak256(data)
	return HashToHex(hash)
}

// HashToHex converts a 32-byte hash to hex string with 0x prefix
func HashToHex(hash [32]byte) string {
	var cHash C.PrimitivesHash
	for i := 0; i < 32; i++ {
		cHash.bytes[i] = C.uint8_t(hash[i])
	}

	// Allocate buffer for hex output (66 bytes: "0x" + 64 hex chars)
	hexBuf := make([]byte, 66)

	result := C.primitives_hash_to_hex(
		&cHash,
		(*C.uint8_t)(unsafe.Pointer(&hexBuf[0])),
	)

	if result != C.PRIMITIVES_SUCCESS {
		panic(fmt.Sprintf("hash_to_hex failed with error code: %d", result))
	}

	return string(hexBuf)
}

// hexToByte converts a hex character to its numeric value
func hexToByte(c byte) byte {
	if c >= '0' && c <= '9' {
		return c - '0'
	}
	if c >= 'a' && c <= 'f' {
		return c - 'a' + 10
	}
	if c >= 'A' && c <= 'F' {
		return c - 'A' + 10
	}
	return 0
}
