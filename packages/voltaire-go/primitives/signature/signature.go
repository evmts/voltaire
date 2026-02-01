// Package signature provides ECDSA signature operations for Ethereum (secp256k1).
package signature

import (
	"encoding/hex"
	"errors"
	"fmt"
)

// Size constants
const (
	Size          = 65 // Full signature size (r + s + v)
	CompactSize   = 64 // Compact signature size (r + s)
	ComponentSize = 32 // Size of r or s component
)

// Errors
var (
	ErrInvalidLength = errors.New("signature: invalid length")
	ErrInvalidHex    = errors.New("signature: invalid hex")
)

// secp256k1 curve order N
var secp256k1N = [32]byte{
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
	0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
	0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
}

// secp256k1 N/2 for canonical check
var secp256k1NHalf = [32]byte{
	0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
	0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa0,
}

// Signature represents an ECDSA signature for Ethereum.
type Signature struct {
	R [32]byte
	S [32]byte
	V byte // 0, 1, 27, 28, or EIP-155 chain-adjusted
}

// FromBytes creates a Signature from a 65-byte slice (r || s || v).
func FromBytes(b []byte) (Signature, error) {
	if len(b) != Size {
		return Signature{}, ErrInvalidLength
	}
	var sig Signature
	copy(sig.R[:], b[:32])
	copy(sig.S[:], b[32:64])
	sig.V = b[64]
	return sig, nil
}

// FromHex creates a Signature from a hex string.
// Accepts both "0x" prefixed and raw hex strings.
func FromHex(s string) (Signature, error) {
	// Remove 0x prefix if present
	if len(s) >= 2 && s[0] == '0' && (s[1] == 'x' || s[1] == 'X') {
		s = s[2:]
	}

	// Must be exactly 130 hex chars (65 bytes)
	if len(s) != Size*2 {
		return Signature{}, ErrInvalidLength
	}

	b, err := hex.DecodeString(s)
	if err != nil {
		return Signature{}, ErrInvalidHex
	}

	return FromBytes(b)
}

// FromRSV creates a Signature from individual r, s, v components.
func FromRSV(r, s [32]byte, v byte) Signature {
	return Signature{R: r, S: s, V: v}
}

// MustFromHex creates a Signature from a hex string, panicking on error.
func MustFromHex(s string) Signature {
	sig, err := FromHex(s)
	if err != nil {
		panic(fmt.Sprintf("signature.MustFromHex: %v", err))
	}
	return sig
}

// Bytes returns the 65-byte representation (r || s || v).
func (sig Signature) Bytes() []byte {
	b := make([]byte, Size)
	copy(b[:32], sig.R[:])
	copy(b[32:64], sig.S[:])
	b[64] = sig.V
	return b
}

// Hex returns the hex-encoded signature with 0x prefix.
func (sig Signature) Hex() string {
	return "0x" + hex.EncodeToString(sig.Bytes())
}

// IsLowS returns true if S is in the lower half of the curve order (canonical form per EIP-2).
func (sig Signature) IsLowS() bool {
	// Compare S with N/2
	for i := 0; i < ComponentSize; i++ {
		if sig.S[i] < secp256k1NHalf[i] {
			return true
		}
		if sig.S[i] > secp256k1NHalf[i] {
			return false
		}
	}
	return true // S == N/2 is canonical
}

// ToLowS converts the signature to canonical low-S form.
// If already canonical, returns the same signature.
// Otherwise, computes S' = N - S and flips V.
func (sig Signature) ToLowS() Signature {
	if sig.IsLowS() {
		return sig
	}

	// Compute S' = N - S
	var newS [32]byte
	var borrow int
	for i := ComponentSize - 1; i >= 0; i-- {
		diff := int(secp256k1N[i]) - int(sig.S[i]) - borrow
		if diff < 0 {
			diff += 256
			borrow = 1
		} else {
			borrow = 0
		}
		newS[i] = byte(diff)
	}

	// Flip V based on its encoding
	newV := flipV(sig.V)

	return Signature{R: sig.R, S: newS, V: newV}
}

// flipV flips the parity bit in V
func flipV(v byte) byte {
	switch {
	case v == 0:
		return 1
	case v == 1:
		return 0
	case v == 27:
		return 28
	case v == 28:
		return 27
	case v >= 35:
		// EIP-155: v = chainId * 2 + 35 + yParity
		// Flip yParity: odd -> even, even -> odd
		if v%2 == 0 {
			return v - 1
		}
		return v + 1
	default:
		// Fallback for other values
		if v%2 == 0 {
			return v - 1
		}
		return v + 1
	}
}

// RecoveryID returns the normalized recovery ID (0 or 1).
func (sig Signature) RecoveryID() byte {
	return normalizeV(sig.V)
}

// YParity returns the y-parity (0 or 1), alias for RecoveryID.
func (sig Signature) YParity() byte {
	return sig.RecoveryID()
}

// normalizeV converts any V encoding to 0 or 1
func normalizeV(v byte) byte {
	switch {
	case v == 0 || v == 1:
		return v
	case v == 27 || v == 28:
		return v - 27
	case v >= 35:
		// EIP-155: v = chainId * 2 + 35 + yParity
		// yParity = (v - 35) % 2
		return (v - 35) % 2
	default:
		return v % 2
	}
}

// Equal returns true if signatures are equal.
func (sig Signature) Equal(other Signature) bool {
	return sig.R == other.R && sig.S == other.S && sig.V == other.V
}

// String returns the hex representation.
func (sig Signature) String() string {
	return sig.Hex()
}

// MarshalText implements encoding.TextMarshaler.
func (sig Signature) MarshalText() ([]byte, error) {
	return []byte(sig.Hex()), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (sig *Signature) UnmarshalText(text []byte) error {
	s, err := FromHex(string(text))
	if err != nil {
		return err
	}
	*sig = s
	return nil
}

// MarshalJSON implements json.Marshaler.
func (sig Signature) MarshalJSON() ([]byte, error) {
	return []byte(`"` + sig.Hex() + `"`), nil
}

// UnmarshalJSON implements json.Unmarshaler.
func (sig *Signature) UnmarshalJSON(data []byte) error {
	if len(data) < 2 || data[0] != '"' || data[len(data)-1] != '"' {
		return ErrInvalidHex
	}
	return sig.UnmarshalText(data[1 : len(data)-1])
}
