// Package privatekey provides 32-byte secp256k1 private key operations.
package privatekey

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"

	"github.com/decred/dcrd/dcrec/secp256k1/v4"
	"github.com/decred/dcrd/dcrec/secp256k1/v4/ecdsa"
	"github.com/voltaire-labs/voltaire-go/internal/ffi"
)

// Size is the size of a private key in bytes.
const Size = 32

// secp256k1 curve order: 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
var curveOrder, _ = new(big.Int).SetString("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141", 16)

// Errors
var (
	ErrInvalidLength = errors.New("private key must be 32 bytes")
	ErrInvalidHex    = errors.New("invalid hex string")
	ErrOutOfRange    = errors.New("private key out of valid range [1, n-1]")
)

// PrivateKey represents a 32-byte secp256k1 private key.
type PrivateKey [Size]byte

// Signature represents a 65-byte ECDSA signature (r + s + v).
type Signature []byte

// Generate creates a new random private key using crypto/rand.
func Generate() (PrivateKey, error) {
	var pk PrivateKey
	for {
		_, err := rand.Read(pk[:])
		if err != nil {
			return PrivateKey{}, err
		}
		if pk.IsValid() {
			return pk, nil
		}
		// Regenerate if invalid (extremely rare)
	}
}

// FromHex creates a PrivateKey from a hex string.
// Accepts both "0x" prefixed and raw hex strings.
func FromHex(s string) (PrivateKey, error) {
	// Strip 0x prefix
	if len(s) >= 2 && s[0] == '0' && (s[1] == 'x' || s[1] == 'X') {
		s = s[2:]
	}

	if len(s) != 64 {
		return PrivateKey{}, ErrInvalidLength
	}

	var pk PrivateKey
	_, err := hex.Decode(pk[:], []byte(s))
	if err != nil {
		return PrivateKey{}, ErrInvalidHex
	}

	if !pk.IsValid() {
		return PrivateKey{}, ErrOutOfRange
	}

	return pk, nil
}

// FromBytes creates a PrivateKey from a byte slice.
// Returns an error if the slice is not exactly 32 bytes or out of range.
func FromBytes(b []byte) (PrivateKey, error) {
	if len(b) != Size {
		return PrivateKey{}, ErrInvalidLength
	}

	var pk PrivateKey
	copy(pk[:], b)

	if !pk.IsValid() {
		return PrivateKey{}, ErrOutOfRange
	}

	return pk, nil
}

// MustFromHex creates a PrivateKey from a hex string, panicking on error.
func MustFromHex(s string) PrivateKey {
	pk, err := FromHex(s)
	if err != nil {
		panic(fmt.Sprintf("privatekey.MustFromHex: %v", err))
	}
	return pk
}

// Hex returns the lowercase hex representation with 0x prefix.
// WARNING: This exposes sensitive key material.
func (pk PrivateKey) Hex() string {
	return "0x" + hex.EncodeToString(pk[:])
}

// Bytes returns the private key as a byte slice.
func (pk PrivateKey) Bytes() []byte {
	return pk[:]
}

// IsValid checks if the private key is in the valid range [1, n-1].
func (pk PrivateKey) IsValid() bool {
	// Check for zero
	isZero := true
	for _, b := range pk {
		if b != 0 {
			isZero = false
			break
		}
	}
	if isZero {
		return false
	}

	// Check if less than curve order
	keyInt := new(big.Int).SetBytes(pk[:])
	return keyInt.Cmp(curveOrder) < 0
}

// PublicKey derives the uncompressed public key (64 bytes, without 0x04 prefix).
func (pk PrivateKey) PublicKey() []byte {
	privKey := secp256k1.PrivKeyFromBytes(pk[:])
	pubKey := privKey.PubKey()

	// SerializeUncompressed returns 65 bytes (0x04 || x || y)
	uncompressed := pubKey.SerializeUncompressed()

	// Return without the 0x04 prefix (64 bytes)
	return uncompressed[1:]
}

// PublicKeyCompressed derives the compressed public key (33 bytes).
func (pk PrivateKey) PublicKeyCompressed() []byte {
	privKey := secp256k1.PrivKeyFromBytes(pk[:])
	pubKey := privKey.PubKey()
	return pubKey.SerializeCompressed()
}

// Address represents a 20-byte Ethereum address.
type Address [20]byte

// Address derives the Ethereum address from the private key.
// Address = keccak256(uncompressed_pubkey)[12:32]
func (pk PrivateKey) Address() Address {
	pubKey := pk.PublicKey()
	if pubKey == nil {
		return Address{}
	}

	// Hash the 64-byte public key with keccak256
	hash := ffi.Keccak256(pubKey)

	// Take last 20 bytes
	var addr Address
	copy(addr[:], hash[12:])
	return addr
}

// Sign creates an ECDSA signature for the given 32-byte hash.
// Returns a 65-byte signature (r[32] + s[32] + v[1]).
func (pk PrivateKey) Sign(hash [32]byte) (Signature, error) {
	privKey := secp256k1.PrivKeyFromBytes(pk[:])

	// SignCompact produces a compact signature with recovery code
	// Format: [v, r, s] where v is recovery code (27 or 28)
	// isCompressedKey should be false for Ethereum compatibility
	sig := ecdsa.SignCompact(privKey, hash[:], false)

	if len(sig) != 65 {
		return nil, errors.New("unexpected signature length")
	}

	// Convert from [v, r, s] to [r, s, v] (Ethereum format)
	result := make([]byte, 65)
	copy(result[0:32], sig[1:33])   // r
	copy(result[32:64], sig[33:65]) // s
	result[64] = sig[0] - 27        // v (convert from 27/28 to 0/1)

	return Signature(result), nil
}

// SignMessage hashes the message with keccak256 and signs it.
// Returns a 65-byte signature.
func (pk PrivateKey) SignMessage(msg []byte) (Signature, error) {
	hash := ffi.Keccak256(msg)
	return pk.Sign(hash)
}
