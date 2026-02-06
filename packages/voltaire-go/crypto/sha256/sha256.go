// Package sha256 provides SHA-256 hashing.
package sha256

import (
	"github.com/voltaire-labs/voltaire-go/internal/ffi"
	"github.com/voltaire-labs/voltaire-go/primitives/hash"
)

// Hash computes the SHA-256 hash of data.
func Hash(data []byte) hash.Hash {
	return hash.Hash(ffi.SHA256(data))
}

// HashString computes the SHA-256 hash of a UTF-8 string.
func HashString(s string) hash.Hash {
	return Hash([]byte(s))
}

// Sum returns the SHA-256 hash of multiple byte slices concatenated.
func Sum(data ...[]byte) hash.Hash {
	total := 0
	for _, d := range data {
		total += len(d)
	}
	combined := make([]byte, 0, total)
	for _, d := range data {
		combined = append(combined, d...)
	}
	return Hash(combined)
}

// DoubleHash computes SHA-256(SHA-256(data)), commonly used in Bitcoin.
func DoubleHash(data []byte) hash.Hash {
	first := Hash(data)
	return Hash(first[:])
}
