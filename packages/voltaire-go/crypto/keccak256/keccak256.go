// Package keccak256 provides Keccak-256 hashing.
package keccak256

import (
	"github.com/voltaire-labs/voltaire-go/internal/ffi"
	"github.com/voltaire-labs/voltaire-go/primitives/hash"
)

// Hash computes the Keccak-256 hash of data.
func Hash(data []byte) hash.Hash {
	return hash.Hash(ffi.Keccak256(data))
}

// HashString computes the Keccak-256 hash of a UTF-8 string.
func HashString(s string) hash.Hash {
	return Hash([]byte(s))
}

// Sum returns the Keccak-256 hash of multiple byte slices concatenated.
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
