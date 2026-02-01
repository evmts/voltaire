// Package ffi provides low-level CGO bindings to voltaire's C API.
package ffi

/*
#cgo LDFLAGS: -L${SRCDIR}/../../../../zig-out/native -lprimitives_ts_native

#include "primitives.h"
#include <stdlib.h>
#include <string.h>
*/
import "C"
import "unsafe"

// Re-export C types for internal use
type (
	CAddress   = C.PrimitivesAddress
	CHash      = C.PrimitivesHash
	CU256      = C.PrimitivesU256
	CSignature = C.PrimitivesSignature
)

// AddressSize is the size of an Ethereum address in bytes.
const AddressSize = 20

// HashSize is the size of a hash in bytes.
const HashSize = 32

// U256Size is the size of a U256 in bytes.
const U256Size = 32

// SignatureSize is the size of a signature (r + s + v) in bytes.
const SignatureSize = 65

// ============================================================================
// Address Functions
// ============================================================================

// AddressFromHex creates an address from a hex string.
func AddressFromHex(hex string) ([AddressSize]byte, error) {
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	var cAddr CAddress
	result := C.primitives_address_from_hex(cHex, &cAddr)
	if result != 0 {
		return [AddressSize]byte{}, MapError(int(result))
	}

	var addr [AddressSize]byte
	C.memcpy(unsafe.Pointer(&addr[0]), unsafe.Pointer(&cAddr.bytes[0]), AddressSize)
	return addr, nil
}

// AddressToHex converts an address to hex string (lowercase, with 0x prefix).
func AddressToHex(addr [AddressSize]byte) string {
	var cAddr CAddress
	C.memcpy(unsafe.Pointer(&cAddr.bytes[0]), unsafe.Pointer(&addr[0]), AddressSize)

	buf := make([]byte, 43) // "0x" + 40 hex chars + null terminator
	C.primitives_address_to_hex(&cAddr, (*C.uint8_t)(unsafe.Pointer(&buf[0])))
	return string(buf[:42])
}

// AddressToChecksumHex converts an address to EIP-55 checksummed hex string.
func AddressToChecksumHex(addr [AddressSize]byte) string {
	var cAddr CAddress
	C.memcpy(unsafe.Pointer(&cAddr.bytes[0]), unsafe.Pointer(&addr[0]), AddressSize)

	buf := make([]byte, 43)
	C.primitives_address_to_checksum_hex(&cAddr, (*C.uint8_t)(unsafe.Pointer(&buf[0])))
	return string(buf[:42])
}

// AddressIsZero returns true if the address is the zero address.
func AddressIsZero(addr [AddressSize]byte) bool {
	var cAddr CAddress
	C.memcpy(unsafe.Pointer(&cAddr.bytes[0]), unsafe.Pointer(&addr[0]), AddressSize)
	return bool(C.primitives_address_is_zero(&cAddr))
}

// AddressEquals returns true if two addresses are equal.
func AddressEquals(a, b [AddressSize]byte) bool {
	var cA, cB CAddress
	C.memcpy(unsafe.Pointer(&cA.bytes[0]), unsafe.Pointer(&a[0]), AddressSize)
	C.memcpy(unsafe.Pointer(&cB.bytes[0]), unsafe.Pointer(&b[0]), AddressSize)
	return bool(C.primitives_address_equals(&cA, &cB))
}

// AddressValidateChecksum validates an EIP-55 checksummed address.
func AddressValidateChecksum(hex string) bool {
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))
	return bool(C.primitives_address_validate_checksum(cHex))
}

// ============================================================================
// Hash Functions
// ============================================================================

// Keccak256 computes the Keccak-256 hash of data.
func Keccak256(data []byte) [HashSize]byte {
	var cHash CHash
	if len(data) == 0 {
		C.primitives_keccak256(nil, 0, &cHash)
	} else {
		C.primitives_keccak256((*C.uint8_t)(unsafe.Pointer(&data[0])), C.size_t(len(data)), &cHash)
	}

	var hash [HashSize]byte
	C.memcpy(unsafe.Pointer(&hash[0]), unsafe.Pointer(&cHash.bytes[0]), HashSize)
	return hash
}

// HashToHex converts a hash to hex string (with 0x prefix).
func HashToHex(hash [HashSize]byte) string {
	var cHash CHash
	C.memcpy(unsafe.Pointer(&cHash.bytes[0]), unsafe.Pointer(&hash[0]), HashSize)

	buf := make([]byte, 67) // "0x" + 64 hex chars + null terminator
	C.primitives_hash_to_hex(&cHash, (*C.uint8_t)(unsafe.Pointer(&buf[0])))
	return string(buf[:66])
}

// HashFromHex creates a hash from a hex string.
func HashFromHex(hex string) ([HashSize]byte, error) {
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	var cHash CHash
	result := C.primitives_hash_from_hex(cHex, &cHash)
	if result != 0 {
		return [HashSize]byte{}, MapError(int(result))
	}

	var hash [HashSize]byte
	C.memcpy(unsafe.Pointer(&hash[0]), unsafe.Pointer(&cHash.bytes[0]), HashSize)
	return hash, nil
}

// HashEquals returns true if two hashes are equal (constant-time).
func HashEquals(a, b [HashSize]byte) bool {
	var cA, cB CHash
	C.memcpy(unsafe.Pointer(&cA.bytes[0]), unsafe.Pointer(&a[0]), HashSize)
	C.memcpy(unsafe.Pointer(&cB.bytes[0]), unsafe.Pointer(&b[0]), HashSize)
	return bool(C.primitives_hash_equals(&cA, &cB))
}

// ============================================================================
// Hex Utilities
// ============================================================================

// HexToBytes converts a hex string to bytes.
func HexToBytes(hex string) ([]byte, error) {
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	// Estimate max output size (hex length / 2)
	hexLen := len(hex)
	if hexLen >= 2 && hex[0] == '0' && (hex[1] == 'x' || hex[1] == 'X') {
		hexLen -= 2
	}
	maxLen := hexLen / 2

	if maxLen == 0 {
		return []byte{}, nil
	}

	buf := make([]byte, maxLen)
	result := C.primitives_hex_to_bytes(cHex, (*C.uint8_t)(unsafe.Pointer(&buf[0])), C.size_t(maxLen))
	if result < 0 {
		return nil, MapError(int(result))
	}

	return buf[:result], nil
}

// BytesToHex converts bytes to a hex string (with 0x prefix).
func BytesToHex(data []byte) string {
	if len(data) == 0 {
		return "0x"
	}

	bufLen := 2 + len(data)*2 + 1 // "0x" + hex chars + null terminator
	buf := make([]byte, bufLen)

	C.primitives_bytes_to_hex(
		(*C.uint8_t)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
		(*C.uint8_t)(unsafe.Pointer(&buf[0])),
		C.size_t(bufLen),
	)

	return string(buf[:2+len(data)*2])
}

// ============================================================================
// U256 Functions
// ============================================================================

// U256FromHex parses a U256 from a hex string.
func U256FromHex(hex string) ([U256Size]byte, error) {
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	var cU256 CU256
	result := C.primitives_u256_from_hex(cHex, &cU256)
	if result != 0 {
		return [U256Size]byte{}, MapError(int(result))
	}

	var u256 [U256Size]byte
	C.memcpy(unsafe.Pointer(&u256[0]), unsafe.Pointer(&cU256.bytes[0]), U256Size)
	return u256, nil
}

// U256ToHex converts a U256 to hex string (with 0x prefix).
func U256ToHex(value [U256Size]byte) string {
	var cU256 CU256
	C.memcpy(unsafe.Pointer(&cU256.bytes[0]), unsafe.Pointer(&value[0]), U256Size)

	buf := make([]byte, 67) // "0x" + 64 hex chars + null terminator
	C.primitives_u256_to_hex(&cU256, (*C.uint8_t)(unsafe.Pointer(&buf[0])), 67)
	return string(buf[:66])
}

// ============================================================================
// SHA256 / RIPEMD160
// ============================================================================

// SHA256 computes the SHA-256 hash of data.
func SHA256(data []byte) [HashSize]byte {
	var hash [HashSize]byte
	if len(data) == 0 {
		C.primitives_sha256(nil, 0, (*C.uint8_t)(unsafe.Pointer(&hash[0])))
	} else {
		C.primitives_sha256((*C.uint8_t)(unsafe.Pointer(&data[0])), C.size_t(len(data)), (*C.uint8_t)(unsafe.Pointer(&hash[0])))
	}
	return hash
}

// RIPEMD160 computes the RIPEMD-160 hash of data.
func RIPEMD160(data []byte) [20]byte {
	var hash [20]byte
	if len(data) == 0 {
		C.primitives_ripemd160(nil, 0, (*C.uint8_t)(unsafe.Pointer(&hash[0])))
	} else {
		C.primitives_ripemd160((*C.uint8_t)(unsafe.Pointer(&data[0])), C.size_t(len(data)), (*C.uint8_t)(unsafe.Pointer(&hash[0])))
	}
	return hash
}

// Blake2b computes the Blake2b hash of data.
func Blake2b(data []byte) [HashSize]byte {
	var hash [HashSize]byte
	if len(data) == 0 {
		C.primitives_blake2b(nil, 0, (*C.uint8_t)(unsafe.Pointer(&hash[0])))
	} else {
		C.primitives_blake2b((*C.uint8_t)(unsafe.Pointer(&data[0])), C.size_t(len(data)), (*C.uint8_t)(unsafe.Pointer(&hash[0])))
	}
	return hash
}

// ============================================================================
// Version
// ============================================================================

// VersionString returns the library version string.
func VersionString() string {
	return C.GoString(C.primitives_version_string())
}
