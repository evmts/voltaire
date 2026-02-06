// Package bytes32 provides a fixed 32-byte array type.
package bytes32

import (
	"bytes"
	"encoding/hex"
	"errors"
	"fmt"
)

// Size is the size of Bytes32 in bytes.
const Size = 32

// Errors
var (
	ErrInvalidHex    = errors.New("bytes32: invalid hex string")
	ErrInvalidLength = errors.New("bytes32: invalid length (expected 32 bytes)")
)

// Bytes32 represents a fixed 32-byte array.
type Bytes32 [Size]byte

// Zero is the zero value (all zeros).
var Zero Bytes32

// FromHex creates a Bytes32 from a hex string.
// Accepts both "0x" prefixed and raw hex strings.
func FromHex(s string) (Bytes32, error) {
	// Strip 0x prefix
	if len(s) >= 2 && s[0] == '0' && (s[1] == 'x' || s[1] == 'X') {
		s = s[2:]
	}

	// Must be exactly 64 hex chars
	if len(s) != Size*2 {
		return Bytes32{}, ErrInvalidLength
	}

	var b Bytes32
	_, err := hex.Decode(b[:], []byte(s))
	if err != nil {
		return Bytes32{}, ErrInvalidHex
	}

	return b, nil
}

// FromBytes creates a Bytes32 from a byte slice.
// Returns an error if the slice is not exactly 32 bytes.
func FromBytes(data []byte) (Bytes32, error) {
	if len(data) != Size {
		return Bytes32{}, ErrInvalidLength
	}

	var b Bytes32
	copy(b[:], data)
	return b, nil
}

// MustFromHex creates a Bytes32 from a hex string, panicking on error.
func MustFromHex(s string) Bytes32 {
	b, err := FromHex(s)
	if err != nil {
		panic(fmt.Sprintf("bytes32.MustFromHex: %v", err))
	}
	return b
}

// Hex returns the lowercase hex representation with 0x prefix.
func (b Bytes32) Hex() string {
	return "0x" + hex.EncodeToString(b[:])
}

// Bytes returns the bytes as a slice.
func (b Bytes32) Bytes() []byte {
	return b[:]
}

// IsZero returns true if all bytes are zero.
func (b Bytes32) IsZero() bool {
	return b == Zero
}

// Equal returns true if the values are equal.
func (b Bytes32) Equal(other Bytes32) bool {
	return b == other
}

// Compare compares two Bytes32 lexicographically.
// Returns -1 if b < other, 0 if b == other, 1 if b > other.
func (b Bytes32) Compare(other Bytes32) int {
	return bytes.Compare(b[:], other[:])
}

// String returns the hex representation.
func (b Bytes32) String() string {
	return b.Hex()
}

// MarshalText implements encoding.TextMarshaler.
func (b Bytes32) MarshalText() ([]byte, error) {
	return []byte(b.Hex()), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (b *Bytes32) UnmarshalText(text []byte) error {
	parsed, err := FromHex(string(text))
	if err != nil {
		return err
	}
	*b = parsed
	return nil
}

// MarshalJSON implements json.Marshaler.
func (b Bytes32) MarshalJSON() ([]byte, error) {
	return []byte(`"` + b.Hex() + `"`), nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (b *Bytes32) UnmarshalJSON(data []byte) error {
	if len(data) < 2 || data[0] != '"' || data[len(data)-1] != '"' {
		return ErrInvalidHex
	}
	return b.UnmarshalText(data[1 : len(data)-1])
}
