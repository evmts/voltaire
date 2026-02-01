// Package ripemd160 provides RIPEMD-160 hashing.
//
// RIPEMD-160 produces a 160-bit (20-byte) hash and is commonly used in
// Bitcoin for address derivation via hash160 (RIPEMD160(SHA256(data))).
package ripemd160

import (
	"crypto/sha256"
	"encoding/hex"
	"hash"

	"golang.org/x/crypto/ripemd160"
)

// Size is the size of a RIPEMD-160 hash in bytes.
const Size = 20

// BlockSize is the block size of RIPEMD-160 in bytes.
const BlockSize = 64

// Hash computes the RIPEMD-160 hash of data.
func Hash(data []byte) [Size]byte {
	h := ripemd160.New()
	h.Write(data)
	var result [Size]byte
	copy(result[:], h.Sum(nil))
	return result
}

// HashString computes the RIPEMD-160 hash of a UTF-8 string.
func HashString(s string) [Size]byte {
	return Hash([]byte(s))
}

// HashToHex computes the RIPEMD-160 hash and returns it as a hex string
// with 0x prefix.
func HashToHex(data []byte) string {
	h := Hash(data)
	return "0x" + hex.EncodeToString(h[:])
}

// Hash160 computes RIPEMD160(SHA256(data)), commonly used in Bitcoin
// for public key hashing and script hashing.
func Hash160(data []byte) [Size]byte {
	sha := sha256.Sum256(data)
	return Hash(sha[:])
}

// Sum is an alias for Hash, provided for API consistency.
func Sum(data []byte) [Size]byte {
	return Hash(data)
}

// New returns a new hash.Hash computing the RIPEMD-160 checksum.
func New() hash.Hash {
	return ripemd160.New()
}
