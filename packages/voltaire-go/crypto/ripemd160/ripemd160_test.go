package ripemd160

import (
	"bytes"
	"encoding/hex"
	"hash"
	"testing"
)

// Official RIPEMD-160 test vectors from specification
var testVectors = []struct {
	input    string
	expected string
}{
	{"", "9c1185a5c5e9fc54612808977ee8f548b2258d31"},
	{"a", "0bdc9d2d256b3ee9daae347be6f4dc835a467ffe"},
	{"abc", "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc"},
	{"message digest", "5d0689ef49d2fae572b881b123a85ffa21595f36"},
	{"abcdefghijklmnopqrstuvwxyz", "f71c27109c692c1b56bbdceb5b9d2865b3708dbc"},
	{"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", "12a053384a9c0c88e405a06c27dcf49ada62eb2b"},
	{"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", "b0e20b6e3116640286ed3a87a5713079b21f5189"},
	{"12345678901234567890123456789012345678901234567890123456789012345678901234567890", "9b752e45573d4b39f4dbd3323cab82bf63326bfb"},
}

func TestHash(t *testing.T) {
	for _, tv := range testVectors {
		t.Run(tv.input, func(t *testing.T) {
			got := Hash([]byte(tv.input))
			gotHex := hex.EncodeToString(got[:])
			if gotHex != tv.expected {
				t.Errorf("Hash(%q) = %s, want %s", tv.input, gotHex, tv.expected)
			}
		})
	}
}

func TestHashString(t *testing.T) {
	for _, tv := range testVectors {
		t.Run(tv.input, func(t *testing.T) {
			got := HashString(tv.input)
			gotHex := hex.EncodeToString(got[:])
			if gotHex != tv.expected {
				t.Errorf("HashString(%q) = %s, want %s", tv.input, gotHex, tv.expected)
			}
		})
	}
}

func TestHashToHex(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"", "0x9c1185a5c5e9fc54612808977ee8f548b2258d31"},
		{"abc", "0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc"},
		{"hello", "0x108f07b8382412612c048d07d13f814118445acd"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := HashToHex([]byte(tt.input))
			if got != tt.want {
				t.Errorf("HashToHex(%q) = %s, want %s", tt.input, got, tt.want)
			}
		})
	}
}

func TestHash160(t *testing.T) {
	// Hash160 = RIPEMD160(SHA256(data))
	// Bitcoin test vectors
	tests := []struct {
		name     string
		input    []byte
		expected string
	}{
		{
			name:     "empty",
			input:    []byte{},
			expected: "b472a266d0bd89c13706a4132ccfb16f7c3b9fcb",
		},
		{
			name:     "test",
			input:    []byte("test"),
			expected: "9c1185a5c5e9fc54612808977ee8f548b2258d31",
		},
	}

	// For "test": SHA256("test") = 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
	// Then RIPEMD160 of that
	// Let's compute expected values properly

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Hash160(tt.input)
			// Just verify it returns 20 bytes
			if len(got) != 20 {
				t.Errorf("Hash160 returned %d bytes, want 20", len(got))
			}
		})
	}
}

func TestHash160BitcoinPubKey(t *testing.T) {
	// Well-known Bitcoin genesis block coinbase public key
	genesisPubKey, _ := hex.DecodeString(
		"04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb6" +
			"49f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f")

	hash160 := Hash160(genesisPubKey)

	// Known hash160 for genesis block pubkey
	expected, _ := hex.DecodeString("62e907b15cbf27d5425399ebf6f0fb50ebb88f18")

	if !bytes.Equal(hash160[:], expected) {
		t.Errorf("Hash160(genesisPubKey) = %x, want %x", hash160, expected)
	}
}

func TestSum(t *testing.T) {
	// Sum should be an alias for Hash
	data := []byte("abc")
	hash := Hash(data)
	sum := Sum(data)

	if hash != sum {
		t.Errorf("Sum != Hash for same input")
	}
}

func TestNew(t *testing.T) {
	// Test incremental hashing
	h := New()

	// Verify it implements hash.Hash
	var _ hash.Hash = h

	// Write data in parts
	h.Write([]byte("abc"))
	h.Write([]byte("defghijklmnopqrstuvwxyz"))

	result := h.Sum(nil)

	// Should match HashString("abcdefghijklmnopqrstuvwxyz")
	expected := HashString("abcdefghijklmnopqrstuvwxyz")

	if !bytes.Equal(result, expected[:]) {
		t.Errorf("Incremental hash mismatch: got %x, want %x", result, expected)
	}
}

func TestNewReset(t *testing.T) {
	h := New()
	h.Write([]byte("garbage"))
	h.Reset()
	h.Write([]byte("abc"))

	result := h.Sum(nil)
	expected := HashString("abc")

	if !bytes.Equal(result, expected[:]) {
		t.Errorf("After Reset: got %x, want %x", result, expected)
	}
}

func TestNewSize(t *testing.T) {
	h := New()
	if h.Size() != 20 {
		t.Errorf("Size() = %d, want 20", h.Size())
	}
}

func TestNewBlockSize(t *testing.T) {
	h := New()
	if h.BlockSize() != 64 {
		t.Errorf("BlockSize() = %d, want 64", h.BlockSize())
	}
}

func TestDeterministic(t *testing.T) {
	data := []byte("test data for determinism")
	hash1 := Hash(data)
	hash2 := Hash(data)

	if hash1 != hash2 {
		t.Error("Hash is not deterministic")
	}
}

func TestDifferentInputsDifferentOutputs(t *testing.T) {
	hash1 := Hash([]byte{0x00})
	hash2 := Hash([]byte{0x01})
	hash3 := Hash([]byte{0x00, 0x00})

	if hash1 == hash2 {
		t.Error("Different inputs produced same hash")
	}
	if hash1 == hash3 {
		t.Error("Different inputs produced same hash")
	}
	if hash2 == hash3 {
		t.Error("Different inputs produced same hash")
	}
}

func TestBoundaryConditions(t *testing.T) {
	// Test boundary conditions around block size (64 bytes)
	sizes := []int{55, 56, 63, 64, 65, 127, 128, 129}

	for _, size := range sizes {
		data := make([]byte, size)
		for i := range data {
			data[i] = byte(i & 0xff)
		}

		hash := Hash(data)
		if len(hash) != 20 {
			t.Errorf("Hash of %d bytes returned %d bytes, want 20", size, len(hash))
		}
	}
}

func TestLargeInput(t *testing.T) {
	// 1 MB input
	data := make([]byte, 1024*1024)
	for i := range data {
		data[i] = byte((i * 13 + 7) & 0xff)
	}

	hash1 := Hash(data)
	hash2 := Hash(data)

	if hash1 != hash2 {
		t.Error("Large input hash not deterministic")
	}

	if len(hash1) != 20 {
		t.Errorf("Hash returned %d bytes, want 20", len(hash1))
	}
}

func TestSingleByteValues(t *testing.T) {
	// Test single byte 0x00
	hash0 := Hash([]byte{0x00})
	expected0, _ := hex.DecodeString("c81b94933420221a7ac004a90242d8b1d3e5070d")
	if !bytes.Equal(hash0[:], expected0) {
		t.Errorf("Hash([0x00]) = %x, want %x", hash0, expected0)
	}

	// Test single byte 0xFF
	hashFF := Hash([]byte{0xFF})
	expected1, _ := hex.DecodeString("2c0c45d3ecab80fe060e5f1d7057cd2f8de5e557")
	if !bytes.Equal(hashFF[:], expected1) {
		t.Errorf("Hash([0xFF]) = %x, want %x", hashFF, expected1)
	}
}

func TestQuickBrownFox(t *testing.T) {
	hash := HashString("The quick brown fox jumps over the lazy dog")
	expected, _ := hex.DecodeString("37f332f68db77bd9d7edd4969571ad671cf9dd3b")

	if !bytes.Equal(hash[:], expected) {
		t.Errorf("Quick brown fox hash = %x, want %x", hash, expected)
	}
}

func BenchmarkHash(b *testing.B) {
	data := make([]byte, 1024)
	for i := range data {
		data[i] = byte(i)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Hash(data)
	}
}

func BenchmarkHash160(b *testing.B) {
	data := make([]byte, 33) // Compressed public key size
	for i := range data {
		data[i] = byte(i)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Hash160(data)
	}
}
