// Package hash provides hash type and operations.
package hash

import (
	"bytes"
	"fmt"

	"github.com/voltaire-labs/voltaire-go/internal/ffi"
)

// Size is the size of a hash in bytes.
const Size = 32

// Hash represents a 32-byte hash value.
type Hash [Size]byte

// Zero is the zero hash.
var Zero Hash

// FromHex creates a Hash from a hex string.
func FromHex(s string) (Hash, error) {
	arr, err := ffi.HashFromHex(s)
	if err != nil {
		return Hash{}, err
	}
	return Hash(arr), nil
}

// FromBytes creates a Hash from a byte slice.
func FromBytes(b []byte) (Hash, error) {
	if len(b) != Size {
		return Hash{}, ffi.ErrInvalidLength
	}
	var h Hash
	copy(h[:], b)
	return h, nil
}

// MustFromHex creates a Hash from a hex string, panicking on error.
func MustFromHex(s string) Hash {
	h, err := FromHex(s)
	if err != nil {
		panic(fmt.Sprintf("hash.MustFromHex: %v", err))
	}
	return h
}

// Hex returns the hex representation with 0x prefix.
func (h Hash) Hex() string {
	return ffi.HashToHex(h)
}

// Bytes returns the hash as a byte slice.
func (h Hash) Bytes() []byte {
	return h[:]
}

// IsZero returns true if this is the zero hash.
func (h Hash) IsZero() bool {
	return h == Zero
}

// Equal returns true if hashes are equal (constant-time).
func (h Hash) Equal(other Hash) bool {
	return ffi.HashEquals(h, other)
}

// Compare compares two hashes lexicographically.
func (h Hash) Compare(other Hash) int {
	return bytes.Compare(h[:], other[:])
}

// String returns the hex representation.
func (h Hash) String() string {
	return h.Hex()
}

// MarshalText implements encoding.TextMarshaler.
func (h Hash) MarshalText() ([]byte, error) {
	return []byte(h.Hex()), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (h *Hash) UnmarshalText(text []byte) error {
	hash, err := FromHex(string(text))
	if err != nil {
		return err
	}
	*h = hash
	return nil
}

// MarshalJSON implements json.Marshaler.
func (h Hash) MarshalJSON() ([]byte, error) {
	return []byte(`"` + h.Hex() + `"`), nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (h *Hash) UnmarshalJSON(data []byte) error {
	if len(data) < 2 || data[0] != '"' || data[len(data)-1] != '"' {
		return ffi.ErrInvalidInput
	}
	return h.UnmarshalText(data[1 : len(data)-1])
}
