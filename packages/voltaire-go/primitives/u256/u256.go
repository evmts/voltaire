// Package u256 provides 256-bit unsigned integer operations.
package u256

import (
	"bytes"
	"fmt"
	"math/big"

	"github.com/voltaire-labs/voltaire-go/internal/ffi"
)

// Size is the size of a U256 in bytes.
const Size = 32

// U256 represents a 256-bit unsigned integer (big-endian).
type U256 [Size]byte

// Zero is the zero value.
var Zero U256

// One is the value 1.
var One = func() U256 {
	var u U256
	u[31] = 1
	return u
}()

// FromHex creates a U256 from a hex string.
func FromHex(s string) (U256, error) {
	arr, err := ffi.U256FromHex(s)
	if err != nil {
		return U256{}, err
	}
	return U256(arr), nil
}

// FromBytes creates a U256 from a byte slice.
func FromBytes(b []byte) (U256, error) {
	if len(b) > Size {
		return U256{}, ffi.ErrInvalidLength
	}
	var u U256
	// Right-align (big-endian)
	copy(u[Size-len(b):], b)
	return u, nil
}

// FromBigInt creates a U256 from a big.Int.
func FromBigInt(i *big.Int) (U256, error) {
	if i == nil {
		return Zero, nil
	}
	if i.Sign() < 0 {
		return U256{}, ffi.ErrInvalidInput
	}
	if i.BitLen() > 256 {
		return U256{}, ffi.ErrInvalidLength
	}
	b := i.Bytes()
	return FromBytes(b)
}

// FromUint64 creates a U256 from a uint64.
func FromUint64(n uint64) U256 {
	var u U256
	for i := 0; i < 8; i++ {
		u[31-i] = byte(n >> (i * 8))
	}
	return u
}

// MustFromHex creates a U256 from a hex string, panicking on error.
func MustFromHex(s string) U256 {
	u, err := FromHex(s)
	if err != nil {
		panic(fmt.Sprintf("u256.MustFromHex: %v", err))
	}
	return u
}

// Hex returns the hex representation with 0x prefix.
func (u U256) Hex() string {
	return ffi.U256ToHex(u)
}

// Bytes returns the U256 as a byte slice (32 bytes).
func (u U256) Bytes() []byte {
	return u[:]
}

// TrimmedBytes returns the U256 as a byte slice with leading zeros removed.
func (u U256) TrimmedBytes() []byte {
	for i := 0; i < Size; i++ {
		if u[i] != 0 {
			return u[i:]
		}
	}
	return []byte{0}
}

// BigInt returns the U256 as a big.Int.
func (u U256) BigInt() *big.Int {
	return new(big.Int).SetBytes(u[:])
}

// Uint64 returns the U256 as uint64, truncating if necessary.
func (u U256) Uint64() uint64 {
	var n uint64
	for i := 0; i < 8 && (Size-1-i) >= 0; i++ {
		n |= uint64(u[31-i]) << (i * 8)
	}
	return n
}

// IsZero returns true if this is zero.
func (u U256) IsZero() bool {
	return u == Zero
}

// Equal returns true if the values are equal.
func (u U256) Equal(other U256) bool {
	return u == other
}

// Compare compares two U256 values.
// Returns -1 if u < other, 0 if u == other, 1 if u > other.
func (u U256) Compare(other U256) int {
	return bytes.Compare(u[:], other[:])
}

// String returns the hex representation.
func (u U256) String() string {
	return u.Hex()
}

// MarshalText implements encoding.TextMarshaler.
func (u U256) MarshalText() ([]byte, error) {
	return []byte(u.Hex()), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (u *U256) UnmarshalText(text []byte) error {
	v, err := FromHex(string(text))
	if err != nil {
		return err
	}
	*u = v
	return nil
}

// MarshalJSON implements json.Marshaler.
func (u U256) MarshalJSON() ([]byte, error) {
	return []byte(`"` + u.Hex() + `"`), nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (u *U256) UnmarshalJSON(data []byte) error {
	if len(data) < 2 || data[0] != '"' || data[len(data)-1] != '"' {
		return ffi.ErrInvalidInput
	}
	return u.UnmarshalText(data[1 : len(data)-1])
}
