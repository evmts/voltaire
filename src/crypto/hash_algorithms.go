package crypto

/*
#cgo CFLAGS: -I../../zig-out/include
#cgo LDFLAGS: -L../../zig-out/lib -lprimitives_c
#include "primitives.h"
*/
import "C"
import (
	"unsafe"
)

// Hash algorithm output sizes (bytes)
const (
	SHA256Size    = 32
	RIPEMD160Size = 20
)

// SHA256 computes the SHA-256 hash of input data.
//
// SHA-256 is used in various Ethereum precompiles and operations,
// particularly those involving Bitcoin compatibility.
//
// Parameters:
//   - data: Input data to hash
//
// Returns:
//   - [32]byte: SHA-256 hash
func SHA256(data []byte) [32]byte {
	var hash [32]byte

	// Handle empty input
	if len(data) == 0 {
		// SHA-256 of empty string
		C.primitives_sha256(
			nil,
			0,
			(*C.uint8_t)(unsafe.Pointer(&hash[0])),
		)
		return hash
	}

	// Call C function
	result := C.primitives_sha256(
		(*C.uint8_t)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
		(*C.uint8_t)(unsafe.Pointer(&hash[0])),
	)

	if result != C.PRIMITIVES_SUCCESS {
		// This should never happen with valid input
		panic("sha256 failed unexpectedly")
	}

	return hash
}

// RIPEMD160 computes the RIPEMD-160 hash of input data.
//
// RIPEMD-160 is used in Bitcoin address derivation and some
// Ethereum precompiles for Bitcoin compatibility.
//
// Parameters:
//   - data: Input data to hash
//
// Returns:
//   - [20]byte: RIPEMD-160 hash
func RIPEMD160(data []byte) [20]byte {
	var hash [20]byte

	// Handle empty input
	if len(data) == 0 {
		// RIPEMD-160 of empty string
		C.primitives_ripemd160(
			nil,
			0,
			(*C.uint8_t)(unsafe.Pointer(&hash[0])),
		)
		return hash
	}

	// Call C function
	result := C.primitives_ripemd160(
		(*C.uint8_t)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
		(*C.uint8_t)(unsafe.Pointer(&hash[0])),
	)

	if result != C.PRIMITIVES_SUCCESS {
		// This should never happen with valid input
		panic("ripemd160 failed unexpectedly")
	}

	return hash
}

// Hash160 computes Bitcoin-style HASH160 (RIPEMD160(SHA256(data))).
//
// This is commonly used in Bitcoin address derivation and is available
// as an Ethereum precompile.
//
// Parameters:
//   - data: Input data to hash
//
// Returns:
//   - [20]byte: HASH160 result
func Hash160(data []byte) [20]byte {
	sha := SHA256(data)
	return RIPEMD160(sha[:])
}

// DoubleS HA256 computes SHA-256(SHA-256(data)).
//
// This is used in Bitcoin block header hashing and some other
// Bitcoin-compatible operations.
//
// Parameters:
//   - data: Input data to hash
//
// Returns:
//   - [32]byte: Double SHA-256 result
func DoubleSHA256(data []byte) [32]byte {
	first := SHA256(data)
	return SHA256(first[:])
}
