package ffi

import (
	"bytes"
	"testing"

	"golang.org/x/crypto/blake2b"
)

// primitives_blake2b writes 64 bytes; a 32-byte Go buffer would be overrun.
func TestBlake2bReturnsFull512BitDigest(t *testing.T) {
	inputs := [][]byte{nil, {}, []byte("abc"), bytes.Repeat([]byte{0xab}, 1000)}
	for _, in := range inputs {
		got := Blake2b(in)
		want := blake2b.Sum512(in)
		if len(got) != Blake2bSize || !bytes.Equal(got[:], want[:]) {
			t.Fatalf("Blake2b(%x) = %x, want %x", in, got, want)
		}
	}
}
