package primitives

import (
	"errors"
)

// Hash represents a 32-byte hash (typically Keccak-256).
type Hash [32]byte

var (
	// ZeroHash is the zero hash (32 zero bytes)
	ZeroHash = Hash{}

	// Hash errors
	ErrInvalidHashLength = errors.New("invalid hash length: must be 32 bytes")
)

// HashFromHex creates a Hash from a hex string (with 0x prefix).
// The hex string must be exactly 66 characters (0x + 64 hex digits).
func HashFromHex(hexStr string) (Hash, error) {
	if len(hexStr) != 66 || hexStr[0:2] != "0x" {
		return Hash{}, ErrInvalidHashLength
	}

	bytes, err := HexToBytes(hexStr)
	if err != nil {
		return Hash{}, err
	}

	if len(bytes) != 32 {
		return Hash{}, ErrInvalidHashLength
	}

	var hash Hash
	copy(hash[:], bytes)
	return hash, nil
}

// HashFromBytes creates a Hash from a byte slice.
func HashFromBytes(bytes []byte) (Hash, error) {
	if len(bytes) != 32 {
		return Hash{}, ErrInvalidHashLength
	}

	var hash Hash
	copy(hash[:], bytes)
	return hash, nil
}

// ToHex converts the Hash to a hex string (lowercase, with 0x prefix).
func (h Hash) ToHex() string {
	return BytesToHex(h[:])
}

// IsZero returns true if the hash is the zero hash.
func (h Hash) IsZero() bool {
	return h == ZeroHash
}

// Equals performs constant-time comparison of two hashes.
// This is important for cryptographic operations to prevent timing attacks.
func (h Hash) Equals(other Hash) bool {
	return constantTimeCompare(h[:], other[:])
}

// Bytes returns the hash as a byte slice.
func (h Hash) Bytes() []byte {
	return h[:]
}

// String returns the hex representation of the hash.
func (h Hash) String() string {
	return h.ToHex()
}
