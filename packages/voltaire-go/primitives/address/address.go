// Package address provides Ethereum address operations.
package address

import (
	"bytes"
	"encoding/hex"
	"fmt"

	"github.com/voltaire-labs/voltaire-go/internal/ffi"
)

// Size is the size of an Ethereum address in bytes.
const Size = 20

// Address represents a 20-byte Ethereum address.
type Address [Size]byte

// Zero is the zero address.
var Zero Address

// FromHex creates an Address from a hex string.
// Accepts both "0x" prefixed and raw hex strings.
func FromHex(s string) (Address, error) {
	arr, err := ffi.AddressFromHex(s)
	if err != nil {
		return Address{}, err
	}
	return Address(arr), nil
}

// FromBytes creates an Address from a byte slice.
// Returns an error if the slice is not exactly 20 bytes.
func FromBytes(b []byte) (Address, error) {
	if len(b) != Size {
		return Address{}, ffi.ErrInvalidLength
	}
	var addr Address
	copy(addr[:], b)
	return addr, nil
}

// MustFromHex creates an Address from a hex string, panicking on error.
func MustFromHex(s string) Address {
	addr, err := FromHex(s)
	if err != nil {
		panic(fmt.Sprintf("address.MustFromHex: %v", err))
	}
	return addr
}

// Hex returns the lowercase hex representation with 0x prefix.
func (a Address) Hex() string {
	return ffi.AddressToHex(a)
}

// ChecksumHex returns the EIP-55 checksummed hex representation.
func (a Address) ChecksumHex() string {
	return ffi.AddressToChecksumHex(a)
}

// Bytes returns the address as a byte slice.
func (a Address) Bytes() []byte {
	return a[:]
}

// IsZero returns true if this is the zero address.
func (a Address) IsZero() bool {
	return ffi.AddressIsZero(a)
}

// Equal returns true if the addresses are equal.
func (a Address) Equal(other Address) bool {
	return ffi.AddressEquals(a, other)
}

// Compare compares two addresses lexicographically.
// Returns -1 if a < b, 0 if a == b, 1 if a > b.
func (a Address) Compare(b Address) int {
	return bytes.Compare(a[:], b[:])
}

// String returns the checksummed hex representation.
func (a Address) String() string {
	return a.ChecksumHex()
}

// MarshalText implements encoding.TextMarshaler.
func (a Address) MarshalText() ([]byte, error) {
	return []byte(a.ChecksumHex()), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (a *Address) UnmarshalText(text []byte) error {
	addr, err := FromHex(string(text))
	if err != nil {
		return err
	}
	*a = addr
	return nil
}

// MarshalJSON implements json.Marshaler.
func (a Address) MarshalJSON() ([]byte, error) {
	return []byte(`"` + a.ChecksumHex() + `"`), nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (a *Address) UnmarshalJSON(data []byte) error {
	if len(data) < 2 || data[0] != '"' || data[len(data)-1] != '"' {
		return ffi.ErrInvalidInput
	}
	return a.UnmarshalText(data[1 : len(data)-1])
}

// ValidateChecksum validates that a hex string has a valid EIP-55 checksum.
func ValidateChecksum(s string) bool {
	return ffi.AddressValidateChecksum(s)
}

// FromPrivateKey derives an address from a private key.
func FromPrivateKey(privateKey []byte) (Address, error) {
	if len(privateKey) != 32 {
		return Address{}, ffi.ErrInvalidLength
	}
	// TODO: Implement via secp256k1 -> keccak256[12:]
	return Address{}, fmt.Errorf("not implemented")
}

// FromPublicKey derives an address from an uncompressed public key (64 bytes).
func FromPublicKey(publicKey []byte) (Address, error) {
	if len(publicKey) != 64 {
		return Address{}, ffi.ErrInvalidLength
	}
	hash := ffi.Keccak256(publicKey)
	var addr Address
	copy(addr[:], hash[12:])
	return addr, nil
}

// EncodeHex is a helper to encode raw bytes as hex without the 0x prefix.
func EncodeHex(b []byte) string {
	return hex.EncodeToString(b)
}
