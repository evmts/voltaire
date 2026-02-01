// Package blake2 provides BLAKE2b hashing.
package blake2

import (
	"encoding/hex"
	"hash"

	"golang.org/x/crypto/blake2b"
)

// Hash computes the BLAKE2b-256 hash of data.
func Hash(data []byte) [32]byte {
	return blake2b.Sum256(data)
}

// Hash512 computes the BLAKE2b-512 hash of data.
func Hash512(data []byte) [64]byte {
	return blake2b.Sum512(data)
}

// HashString computes the BLAKE2b-256 hash of a UTF-8 string.
func HashString(s string) [32]byte {
	return Hash([]byte(s))
}

// HashToHex computes the BLAKE2b-256 hash and returns it as a hex string.
func HashToHex(data []byte) string {
	h := Hash(data)
	return hex.EncodeToString(h[:])
}

// New256 returns a new hash.Hash computing BLAKE2b-256.
func New256() (hash.Hash, error) {
	return blake2b.New256(nil)
}

// New512 returns a new hash.Hash computing BLAKE2b-512.
func New512() (hash.Hash, error) {
	return blake2b.New512(nil)
}

// Sum256 is an alias for Hash (BLAKE2b-256).
func Sum256(data []byte) [32]byte {
	return Hash(data)
}

// Sum512 is an alias for Hash512 (BLAKE2b-512).
func Sum512(data []byte) [64]byte {
	return Hash512(data)
}
