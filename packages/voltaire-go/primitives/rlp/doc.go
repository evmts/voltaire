// Package rlp implements Recursive Length Prefix encoding per Ethereum Yellow Paper.
//
// RLP is the primary serialization format for Ethereum. It encodes arbitrarily nested
// arrays of binary data (byte strings).
//
// # Encoding Rules
//
// Single byte [0x00, 0x7f]: encoded as itself
// String 0-55 bytes: 0x80 + len, followed by string
// String 56+ bytes: 0xb7 + len_of_len, then len bytes, then string
// List 0-55 bytes: 0xc0 + len, followed by concatenated RLP items
// List 56+ bytes: 0xf7 + len_of_len, then len bytes, then items
//
// # Special Cases
//
// Empty string: 0x80
// Empty list: 0xc0
// Integer 0: encoded as empty string (0x80)
//
// # Usage
//
//	// Encode bytes
//	encoded, err := rlp.Encode([]byte("hello"))
//
//	// Encode list
//	encoded, err := rlp.EncodeList([]interface{}{
//	    []byte("cat"),
//	    []byte("dog"),
//	})
//
//	// Decode
//	decoded, err := rlp.DecodeBytes(encoded)
package rlp
