// Package primitives_cgo provides CGO bindings to the Zig primitives library.
// This file configures CGO to link against libprimitives_c and provides
// access to the C API functions for use by Go crypto wrappers.
package primitives_cgo

// #cgo CFLAGS: -I${SRCDIR}/../../zig-out/include
// #cgo LDFLAGS: -L${SRCDIR}/../../zig-out/lib -lprimitives_c
// #include <primitives.h>
// #include <stdlib.h>
import "C"
import (
	"errors"
	"unsafe"
)

// Error codes from C API
const (
	PRIMITIVES_SUCCESS                = C.PRIMITIVES_SUCCESS
	PRIMITIVES_ERROR_INVALID_HEX      = C.PRIMITIVES_ERROR_INVALID_HEX
	PRIMITIVES_ERROR_INVALID_LENGTH   = C.PRIMITIVES_ERROR_INVALID_LENGTH
	PRIMITIVES_ERROR_INVALID_CHECKSUM = C.PRIMITIVES_ERROR_INVALID_CHECKSUM
	PRIMITIVES_ERROR_OUT_OF_MEMORY    = C.PRIMITIVES_ERROR_OUT_OF_MEMORY
	PRIMITIVES_ERROR_INVALID_INPUT    = C.PRIMITIVES_ERROR_INVALID_INPUT
	PRIMITIVES_ERROR_INVALID_SIGNATURE = C.PRIMITIVES_ERROR_INVALID_SIGNATURE
)

// Error messages
var (
	ErrInvalidHex      = errors.New("invalid hexadecimal string")
	ErrInvalidLength   = errors.New("invalid length for operation")
	ErrInvalidChecksum = errors.New("invalid checksum (EIP-55)")
	ErrOutOfMemory     = errors.New("out of memory")
	ErrInvalidInput    = errors.New("invalid input parameter")
	ErrInvalidSignature = errors.New("invalid signature")
)

// mapCError converts C error codes to Go errors
func mapCError(code C.int) error {
	switch code {
	case C.PRIMITIVES_SUCCESS:
		return nil
	case C.PRIMITIVES_ERROR_INVALID_HEX:
		return ErrInvalidHex
	case C.PRIMITIVES_ERROR_INVALID_LENGTH:
		return ErrInvalidLength
	case C.PRIMITIVES_ERROR_INVALID_CHECKSUM:
		return ErrInvalidChecksum
	case C.PRIMITIVES_ERROR_OUT_OF_MEMORY:
		return ErrOutOfMemory
	case C.PRIMITIVES_ERROR_INVALID_INPUT:
		return ErrInvalidInput
	case C.PRIMITIVES_ERROR_INVALID_SIGNATURE:
		return ErrInvalidSignature
	default:
		return errors.New("unknown error")
	}
}

// Address represents an Ethereum address (20 bytes)
type Address [20]byte

// Hash represents a hash value (32 bytes)
type Hash [32]byte

// U256 represents a 256-bit unsigned integer (32 bytes, big-endian)
type U256 [32]byte

// AddressFromHex creates an address from a hex string
func AddressFromHex(hex string) (Address, error) {
	var addr Address
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	var cAddr C.PrimitivesAddress
	result := C.primitives_address_from_hex(cHex, &cAddr)
	if result != C.PRIMITIVES_SUCCESS {
		return addr, mapCError(result)
	}

	copy(addr[:], C.GoBytes(unsafe.Pointer(&cAddr.bytes[0]), 20))
	return addr, nil
}

// ToHex converts an address to a hex string (with 0x prefix)
func (a Address) ToHex() (string, error) {
	var cAddr C.PrimitivesAddress
	for i := 0; i < 20; i++ {
		cAddr.bytes[i] = C.uint8_t(a[i])
	}

	buf := make([]byte, 42)
	result := C.primitives_address_to_hex(&cAddr, (*C.uint8_t)(unsafe.Pointer(&buf[0])))
	if result != C.PRIMITIVES_SUCCESS {
		return "", mapCError(result)
	}

	return string(buf), nil
}

// ToChecksumHex converts an address to a checksummed hex string (EIP-55)
func (a Address) ToChecksumHex() (string, error) {
	var cAddr C.PrimitivesAddress
	for i := 0; i < 20; i++ {
		cAddr.bytes[i] = C.uint8_t(a[i])
	}

	buf := make([]byte, 42)
	result := C.primitives_address_to_checksum_hex(&cAddr, (*C.uint8_t)(unsafe.Pointer(&buf[0])))
	if result != C.PRIMITIVES_SUCCESS {
		return "", mapCError(result)
	}

	return string(buf), nil
}

// IsZero checks if the address is the zero address
func (a Address) IsZero() bool {
	var cAddr C.PrimitivesAddress
	for i := 0; i < 20; i++ {
		cAddr.bytes[i] = C.uint8_t(a[i])
	}

	return bool(C.primitives_address_is_zero(&cAddr))
}

// Equals compares two addresses for equality
func (a Address) Equals(other Address) bool {
	var cAddr1, cAddr2 C.PrimitivesAddress
	for i := 0; i < 20; i++ {
		cAddr1.bytes[i] = C.uint8_t(a[i])
		cAddr2.bytes[i] = C.uint8_t(other[i])
	}

	return bool(C.primitives_address_equals(&cAddr1, &cAddr2))
}

// ValidateChecksum validates an EIP-55 checksum
func ValidateChecksum(hex string) bool {
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	return bool(C.primitives_address_validate_checksum(cHex))
}

// Keccak256 computes the Keccak-256 hash of input data
func Keccak256(data []byte) (Hash, error) {
	var hash Hash
	var cHash C.PrimitivesHash

	result := C.primitives_keccak256(
		(*C.uint8_t)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
		&cHash,
	)
	if result != C.PRIMITIVES_SUCCESS {
		return hash, mapCError(result)
	}

	copy(hash[:], C.GoBytes(unsafe.Pointer(&cHash.bytes[0]), 32))
	return hash, nil
}

// ToHex converts a hash to a hex string (with 0x prefix)
func (h Hash) ToHex() (string, error) {
	var cHash C.PrimitivesHash
	for i := 0; i < 32; i++ {
		cHash.bytes[i] = C.uint8_t(h[i])
	}

	buf := make([]byte, 66)
	result := C.primitives_hash_to_hex(&cHash, (*C.uint8_t)(unsafe.Pointer(&buf[0])))
	if result != C.PRIMITIVES_SUCCESS {
		return "", mapCError(result)
	}

	return string(buf), nil
}

// HashFromHex creates a hash from a hex string
func HashFromHex(hex string) (Hash, error) {
	var hash Hash
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	var cHash C.PrimitivesHash
	result := C.primitives_hash_from_hex(cHex, &cHash)
	if result != C.PRIMITIVES_SUCCESS {
		return hash, mapCError(result)
	}

	copy(hash[:], C.GoBytes(unsafe.Pointer(&cHash.bytes[0]), 32))
	return hash, nil
}

// Equals compares two hashes for equality (constant-time)
func (h Hash) Equals(other Hash) bool {
	var cHash1, cHash2 C.PrimitivesHash
	for i := 0; i < 32; i++ {
		cHash1.bytes[i] = C.uint8_t(h[i])
		cHash2.bytes[i] = C.uint8_t(other[i])
	}

	return bool(C.primitives_hash_equals(&cHash1, &cHash2))
}

// HexToBytes converts a hex string to bytes
func HexToBytes(hex string) ([]byte, error) {
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	// Allocate a buffer large enough for the result
	buf := make([]byte, len(hex))
	result := C.primitives_hex_to_bytes(
		cHex,
		(*C.uint8_t)(unsafe.Pointer(&buf[0])),
		C.size_t(len(buf)),
	)
	if result < 0 {
		return nil, mapCError(result)
	}

	return buf[:int(result)], nil
}

// BytesToHex converts bytes to a hex string (with 0x prefix)
func BytesToHex(data []byte) (string, error) {
	// Buffer size: "0x" + 2 chars per byte
	bufSize := 2 + (len(data) * 2)
	buf := make([]byte, bufSize)

	result := C.primitives_bytes_to_hex(
		(*C.uint8_t)(unsafe.Pointer(&data[0])),
		C.size_t(len(data)),
		(*C.uint8_t)(unsafe.Pointer(&buf[0])),
		C.size_t(bufSize),
	)
	if result < 0 {
		return "", mapCError(result)
	}

	return string(buf[:int(result)]), nil
}

// U256FromHex parses a U256 from a hex string
func U256FromHex(hex string) (U256, error) {
	var u256 U256
	cHex := C.CString(hex)
	defer C.free(unsafe.Pointer(cHex))

	var cU256 C.PrimitivesU256
	result := C.primitives_u256_from_hex(cHex, &cU256)
	if result != C.PRIMITIVES_SUCCESS {
		return u256, mapCError(result)
	}

	copy(u256[:], C.GoBytes(unsafe.Pointer(&cU256.bytes[0]), 32))
	return u256, nil
}

// ToHex converts a U256 to a hex string (with 0x prefix)
func (u U256) ToHex() (string, error) {
	var cU256 C.PrimitivesU256
	for i := 0; i < 32; i++ {
		cU256.bytes[i] = C.uint8_t(u[i])
	}

	buf := make([]byte, 66)
	result := C.primitives_u256_to_hex(&cU256, (*C.uint8_t)(unsafe.Pointer(&buf[0])), C.size_t(66))
	if result != C.PRIMITIVES_SUCCESS {
		return "", mapCError(result)
	}

	return string(buf), nil
}

// EIP191HashMessage hashes a message using EIP-191 personal message format
func EIP191HashMessage(message []byte) (Hash, error) {
	var hash Hash
	var cHash C.PrimitivesHash

	result := C.primitives_eip191_hash_message(
		(*C.uint8_t)(unsafe.Pointer(&message[0])),
		C.size_t(len(message)),
		&cHash,
	)
	if result != C.PRIMITIVES_SUCCESS {
		return hash, mapCError(result)
	}

	copy(hash[:], C.GoBytes(unsafe.Pointer(&cHash.bytes[0]), 32))
	return hash, nil
}

// CalculateCreateAddress calculates the CREATE contract address
func CalculateCreateAddress(sender Address, nonce uint64) (Address, error) {
	var addr Address
	var cSender C.PrimitivesAddress
	for i := 0; i < 20; i++ {
		cSender.bytes[i] = C.uint8_t(sender[i])
	}

	var cAddr C.PrimitivesAddress
	result := C.primitives_calculate_create_address(&cSender, C.uint64_t(nonce), &cAddr)
	if result != C.PRIMITIVES_SUCCESS {
		return addr, mapCError(result)
	}

	copy(addr[:], C.GoBytes(unsafe.Pointer(&cAddr.bytes[0]), 20))
	return addr, nil
}

// Version returns the library version string
func Version() string {
	return C.GoString(C.primitives_version_string())
}
