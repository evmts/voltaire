// Package publickey provides secp256k1 public key operations.
package publickey

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"errors"
	"fmt"
	"math/big"

	"github.com/voltaire-labs/voltaire-go/internal/ffi"
	"github.com/voltaire-labs/voltaire-go/primitives/address"
)

// secp256k1 curve parameters
var (
	secp256k1N, _  = new(big.Int).SetString("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16)
	secp256k1P, _  = new(big.Int).SetString("fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f", 16)
	secp256k1B     = big.NewInt(7)
	secp256k1Three = big.NewInt(3)
)

// Errors
var (
	ErrInvalidLength = errors.New("publickey: invalid length")
	ErrInvalidPrefix = errors.New("publickey: invalid prefix")
	ErrInvalidPoint  = errors.New("publickey: point not on curve")
	ErrInvalidHex    = errors.New("publickey: invalid hex")
)

// PublicKey represents a secp256k1 public key.
// Internally stores the 65-byte uncompressed format (04 || X || Y).
type PublicKey struct {
	bytes [65]byte
}

// FromBytes creates a PublicKey from bytes.
// Accepts 33 (compressed), 64 (uncompressed no prefix), or 65 (uncompressed with prefix) bytes.
func FromBytes(b []byte) (PublicKey, error) {
	var pk PublicKey

	switch len(b) {
	case 33:
		// Compressed format: 02/03 || X
		if b[0] != 0x02 && b[0] != 0x03 {
			return pk, ErrInvalidPrefix
		}
		x := new(big.Int).SetBytes(b[1:33])
		y, err := decompressY(x, b[0] == 0x03)
		if err != nil {
			return pk, err
		}
		pk.bytes[0] = 0x04
		copy(pk.bytes[1:33], padTo32(x.Bytes()))
		copy(pk.bytes[33:65], padTo32(y.Bytes()))

	case 64:
		// Uncompressed without prefix: X || Y
		pk.bytes[0] = 0x04
		copy(pk.bytes[1:], b)

	case 65:
		// Uncompressed with prefix: 04 || X || Y
		if b[0] != 0x04 {
			return pk, ErrInvalidPrefix
		}
		copy(pk.bytes[:], b)

	default:
		return pk, ErrInvalidLength
	}

	// Validate point is on curve
	if !pk.IsValid() {
		return PublicKey{}, ErrInvalidPoint
	}

	return pk, nil
}

// FromHex creates a PublicKey from a hex string.
// Accepts both "0x" prefixed and raw hex strings.
func FromHex(s string) (PublicKey, error) {
	b, err := ffi.HexToBytes(s)
	if err != nil {
		return PublicKey{}, ErrInvalidHex
	}
	return FromBytes(b)
}

// MustFromHex creates a PublicKey from a hex string, panicking on error.
func MustFromHex(s string) PublicKey {
	pk, err := FromHex(s)
	if err != nil {
		panic(fmt.Sprintf("publickey.MustFromHex: %v", err))
	}
	return pk
}

// Bytes returns the 65-byte uncompressed format (04 || X || Y).
func (pk PublicKey) Bytes() []byte {
	result := make([]byte, 65)
	copy(result, pk.bytes[:])
	return result
}

// BytesUncompressed returns the 64-byte format (X || Y) without the 04 prefix.
func (pk PublicKey) BytesUncompressed() []byte {
	result := make([]byte, 64)
	copy(result, pk.bytes[1:65])
	return result
}

// BytesCompressed returns the 33-byte compressed format (02/03 || X).
func (pk PublicKey) BytesCompressed() []byte {
	result := make([]byte, 33)

	// Determine prefix from Y parity
	y := new(big.Int).SetBytes(pk.bytes[33:65])
	if y.Bit(0) == 0 {
		result[0] = 0x02 // even Y
	} else {
		result[0] = 0x03 // odd Y
	}

	copy(result[1:], pk.bytes[1:33])
	return result
}

// Hex returns the uncompressed hex representation with 0x prefix (130 chars).
func (pk PublicKey) Hex() string {
	return ffi.BytesToHex(pk.bytes[:])
}

// HexCompressed returns the compressed hex representation with 0x prefix (68 chars).
func (pk PublicKey) HexCompressed() string {
	return ffi.BytesToHex(pk.BytesCompressed())
}

// Address derives the Ethereum address from this public key.
// Address = keccak256(uncompressed_64_bytes)[12:]
func (pk PublicKey) Address() address.Address {
	// Hash the 64-byte uncompressed key (without 04 prefix)
	hash := ffi.Keccak256(pk.bytes[1:65])

	var addr address.Address
	copy(addr[:], hash[12:32])
	return addr
}

// IsValid returns true if the public key point is on the secp256k1 curve.
func (pk PublicKey) IsValid() bool {
	x := new(big.Int).SetBytes(pk.bytes[1:33])
	y := new(big.Int).SetBytes(pk.bytes[33:65])

	// Check x and y are in valid range
	if x.Sign() <= 0 || x.Cmp(secp256k1P) >= 0 {
		return false
	}
	if y.Sign() <= 0 || y.Cmp(secp256k1P) >= 0 {
		return false
	}

	// Check y^2 = x^3 + 7 (mod p)
	return isOnCurve(x, y)
}

// Equal returns true if this public key equals another.
func (pk PublicKey) Equal(other PublicKey) bool {
	// Constant-time comparison
	var result byte
	for i := 0; i < 65; i++ {
		result |= pk.bytes[i] ^ other.bytes[i]
	}
	return result == 0
}

// String returns the compressed hex representation.
func (pk PublicKey) String() string {
	return pk.HexCompressed()
}

// MarshalText implements encoding.TextMarshaler.
func (pk PublicKey) MarshalText() ([]byte, error) {
	return []byte(pk.HexCompressed()), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (pk *PublicKey) UnmarshalText(text []byte) error {
	parsed, err := FromHex(string(text))
	if err != nil {
		return err
	}
	*pk = parsed
	return nil
}

// MarshalJSON implements json.Marshaler.
func (pk PublicKey) MarshalJSON() ([]byte, error) {
	return []byte(`"` + pk.HexCompressed() + `"`), nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (pk *PublicKey) UnmarshalJSON(data []byte) error {
	if len(data) < 2 || data[0] != '"' || data[len(data)-1] != '"' {
		return ErrInvalidHex
	}
	return pk.UnmarshalText(data[1 : len(data)-1])
}

// ToECDSA converts to a standard library ecdsa.PublicKey.
// Note: Uses P256 curve parameters since Go's crypto/ecdsa doesn't have secp256k1.
// For actual secp256k1 operations, use this package's methods.
func (pk PublicKey) ToECDSA() *ecdsa.PublicKey {
	x := new(big.Int).SetBytes(pk.bytes[1:33])
	y := new(big.Int).SetBytes(pk.bytes[33:65])
	return &ecdsa.PublicKey{
		Curve: elliptic.P256(), // Note: Not actually secp256k1
		X:     x,
		Y:     y,
	}
}

// decompressY computes Y from X and parity for secp256k1.
// Y^2 = X^3 + 7 (mod p)
func decompressY(x *big.Int, oddY bool) (*big.Int, error) {
	// Validate x < p
	if x.Cmp(secp256k1P) >= 0 {
		return nil, ErrInvalidPoint
	}

	// y^2 = x^3 + 7 (mod p)
	x3 := new(big.Int).Exp(x, secp256k1Three, secp256k1P)
	y2 := new(big.Int).Add(x3, secp256k1B)
	y2.Mod(y2, secp256k1P)

	// y = sqrt(y^2) mod p
	// For secp256k1, p = 3 (mod 4), so sqrt(a) = a^((p+1)/4) mod p
	exp := new(big.Int).Add(secp256k1P, big.NewInt(1))
	exp.Div(exp, big.NewInt(4))
	y := new(big.Int).Exp(y2, exp, secp256k1P)

	// Verify y^2 = x^3 + 7
	ySquared := new(big.Int).Mul(y, y)
	ySquared.Mod(ySquared, secp256k1P)
	if ySquared.Cmp(y2) != 0 {
		return nil, ErrInvalidPoint
	}

	// Select correct y based on parity
	if oddY != (y.Bit(0) == 1) {
		y.Sub(secp256k1P, y)
	}

	return y, nil
}

// isOnCurve checks if (x, y) is on secp256k1: y^2 = x^3 + 7 (mod p)
func isOnCurve(x, y *big.Int) bool {
	// y^2 mod p
	y2 := new(big.Int).Mul(y, y)
	y2.Mod(y2, secp256k1P)

	// x^3 + 7 mod p
	x3 := new(big.Int).Exp(x, secp256k1Three, secp256k1P)
	x3Plus7 := new(big.Int).Add(x3, secp256k1B)
	x3Plus7.Mod(x3Plus7, secp256k1P)

	return y2.Cmp(x3Plus7) == 0
}

// padTo32 pads a byte slice to 32 bytes (left-pad with zeros).
func padTo32(b []byte) []byte {
	if len(b) >= 32 {
		return b[len(b)-32:]
	}
	result := make([]byte, 32)
	copy(result[32-len(b):], b)
	return result
}
