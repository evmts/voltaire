// Package bytes provides byte slice utilities with safe operations.
package bytes

import (
	"crypto/subtle"
	"errors"
)

// Errors returned by byte operations.
var (
	ErrOutOfBounds   = errors.New("bytes: slice indices out of bounds")
	ErrNegativeIndex = errors.New("bytes: negative index")
)

// Concat concatenates multiple byte slices into one.
// Returns empty slice if no inputs provided.
func Concat(slices ...[]byte) []byte {
	if len(slices) == 0 {
		return []byte{}
	}

	// Calculate total length
	total := 0
	for _, s := range slices {
		total += len(s)
	}

	// Allocate and copy
	result := make([]byte, total)
	offset := 0
	for _, s := range slices {
		copy(result[offset:], s)
		offset += len(s)
	}

	return result
}

// Slice returns a new slice from start to end (exclusive).
// Returns error if indices are out of bounds or negative.
func Slice(b []byte, start, end int) ([]byte, error) {
	if start < 0 || end < 0 {
		return nil, ErrNegativeIndex
	}
	if start > end || end > len(b) {
		return nil, ErrOutOfBounds
	}

	result := make([]byte, end-start)
	copy(result, b[start:end])
	return result, nil
}

// PadLeft pads byte slice to target size with padByte on the left.
// If slice is already at or exceeds target size, returns a copy unchanged.
func PadLeft(b []byte, size int, padByte byte) []byte {
	if len(b) >= size {
		result := make([]byte, len(b))
		copy(result, b)
		return result
	}

	result := make([]byte, size)
	padLen := size - len(b)

	// Fill padding bytes
	for i := 0; i < padLen; i++ {
		result[i] = padByte
	}

	// Copy original data
	copy(result[padLen:], b)
	return result
}

// PadRight pads byte slice to target size with padByte on the right.
// If slice is already at or exceeds target size, returns a copy unchanged.
func PadRight(b []byte, size int, padByte byte) []byte {
	if len(b) >= size {
		result := make([]byte, len(b))
		copy(result, b)
		return result
	}

	result := make([]byte, size)
	copy(result, b)

	// Fill padding bytes
	for i := len(b); i < size; i++ {
		result[i] = padByte
	}

	return result
}

// TrimLeft removes leading bytes equal to trimByte.
func TrimLeft(b []byte, trimByte byte) []byte {
	start := 0
	for start < len(b) && b[start] == trimByte {
		start++
	}

	result := make([]byte, len(b)-start)
	copy(result, b[start:])
	return result
}

// TrimRight removes trailing bytes equal to trimByte.
func TrimRight(b []byte, trimByte byte) []byte {
	end := len(b)
	for end > 0 && b[end-1] == trimByte {
		end--
	}

	result := make([]byte, end)
	copy(result, b[:end])
	return result
}

// Equal compares two byte slices in constant time.
// Safe for cryptographic comparison - no timing side-channel.
func Equal(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	if len(a) == 0 {
		return true
	}
	return subtle.ConstantTimeCompare(a, b) == 1
}

// IsZero returns true if all bytes are zero.
// Returns true for nil or empty slices.
func IsZero(b []byte) bool {
	for _, v := range b {
		if v != 0 {
			return false
		}
	}
	return true
}

// Reverse returns a new slice with bytes in reverse order.
// Does not modify the original slice.
func Reverse(b []byte) []byte {
	if len(b) == 0 {
		return []byte{}
	}

	result := make([]byte, len(b))
	for i, j := 0, len(b)-1; i < len(b); i, j = i+1, j-1 {
		result[i] = b[j]
	}
	return result
}

// Copy returns a new slice with the same content.
// Safe - modifications to copy don't affect original.
func Copy(b []byte) []byte {
	if b == nil {
		return []byte{}
	}
	result := make([]byte, len(b))
	copy(result, b)
	return result
}
