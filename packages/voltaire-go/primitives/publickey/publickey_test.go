package publickey

import (
	"bytes"
	"encoding/hex"
	"encoding/json"
	"testing"
)

// Test vectors from secp256k1 generator point
var (
	// Generator point G (private key = 1)
	generatorX = mustDecodeHex("79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")
	generatorY = mustDecodeHex("483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")

	// Compressed generator (02 prefix - even y)
	generatorCompressed = mustDecodeHex("0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")

	// Point from private key 6 (odd y)
	pk6X          = mustDecodeHex("fff97bd5755eeea420453a14355235d382f6472f8568a18b2f057a1460297556")
	pk6Y          = mustDecodeHex("ae12777aacfbb620f3be96017f45c560de80f0f6518fe4a03c870c36b075f297")
	pk6Compressed = mustDecodeHex("03fff97bd5755eeea420453a14355235d382f6472f8568a18b2f057a1460297556")
)

func mustDecodeHex(s string) []byte {
	b, err := hex.DecodeString(s)
	if err != nil {
		panic(err)
	}
	return b
}

func TestFromBytes_Compressed(t *testing.T) {
	pk, err := FromBytes(generatorCompressed)
	if err != nil {
		t.Fatalf("FromBytes compressed failed: %v", err)
	}

	// Should decompress to correct X coordinate
	uncompressed := pk.BytesUncompressed()
	if !bytes.Equal(uncompressed[:32], generatorX) {
		t.Errorf("X coordinate mismatch")
	}

	// Y coordinate should be even (last byte even)
	if uncompressed[63]&1 != 0 {
		t.Errorf("Y coordinate should be even")
	}
}

func TestFromBytes_CompressedOddY(t *testing.T) {
	pk, err := FromBytes(pk6Compressed)
	if err != nil {
		t.Fatalf("FromBytes compressed (odd y) failed: %v", err)
	}

	uncompressed := pk.BytesUncompressed()
	if !bytes.Equal(uncompressed[:32], pk6X) {
		t.Errorf("X coordinate mismatch")
	}

	// Y coordinate should be odd
	if uncompressed[63]&1 != 1 {
		t.Errorf("Y coordinate should be odd")
	}
}

func TestFromBytes_Uncompressed64(t *testing.T) {
	// 64 bytes without prefix
	input := append(generatorX, generatorY...)
	pk, err := FromBytes(input)
	if err != nil {
		t.Fatalf("FromBytes 64-byte failed: %v", err)
	}

	if !bytes.Equal(pk.BytesUncompressed(), input) {
		t.Errorf("Bytes mismatch for 64-byte input")
	}
}

func TestFromBytes_Uncompressed65(t *testing.T) {
	// 65 bytes with 0x04 prefix
	input := append([]byte{0x04}, generatorX...)
	input = append(input, generatorY...)

	pk, err := FromBytes(input)
	if err != nil {
		t.Fatalf("FromBytes 65-byte failed: %v", err)
	}

	if !bytes.Equal(pk.Bytes(), input) {
		t.Errorf("Bytes mismatch for 65-byte input")
	}
}

func TestFromBytes_InvalidLength(t *testing.T) {
	tests := []struct {
		name   string
		length int
	}{
		{"empty", 0},
		{"too short", 32},
		{"wrong size", 50},
		{"too long", 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := make([]byte, tt.length)
			_, err := FromBytes(input)
			if err == nil {
				t.Errorf("Expected error for %d bytes", tt.length)
			}
		})
	}
}

func TestFromBytes_InvalidCompressedPrefix(t *testing.T) {
	// 33 bytes with invalid prefix
	input := make([]byte, 33)
	input[0] = 0x04 // Invalid for compressed
	copy(input[1:], generatorX)

	_, err := FromBytes(input)
	if err == nil {
		t.Error("Expected error for invalid compressed prefix")
	}
}

func TestFromBytes_InvalidUncompressedPrefix(t *testing.T) {
	// 65 bytes with invalid prefix
	input := make([]byte, 65)
	input[0] = 0x02 // Invalid for 65-byte
	copy(input[1:33], generatorX)
	copy(input[33:], generatorY)

	_, err := FromBytes(input)
	if err == nil {
		t.Error("Expected error for invalid uncompressed prefix")
	}
}

func TestFromHex(t *testing.T) {
	tests := []struct {
		name string
		hex  string
	}{
		{"compressed with 0x", "0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"},
		{"uncompressed 64-byte", "0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"},
		{"uncompressed 65-byte", "0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pk, err := FromHex(tt.hex)
			if err != nil {
				t.Fatalf("FromHex failed: %v", err)
			}

			// Should match generator X coordinate
			if !bytes.Equal(pk.BytesUncompressed()[:32], generatorX) {
				t.Error("X coordinate mismatch")
			}
		})
	}
}

func TestFromHex_Invalid(t *testing.T) {
	tests := []struct {
		name string
		hex  string
	}{
		{"too short", "0x1234"},
		{"invalid chars", "0xgggg"},
		{"odd length", "0x123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := FromHex(tt.hex)
			if err == nil {
				t.Error("Expected error")
			}
		})
	}
}

func TestMustFromHex(t *testing.T) {
	pk := MustFromHex("0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")
	if !bytes.Equal(pk.BytesUncompressed()[:32], generatorX) {
		t.Error("X coordinate mismatch")
	}
}

func TestMustFromHex_Panics(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Error("Expected panic")
		}
	}()
	MustFromHex("invalid")
}

func TestBytes(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)

	b := pk.Bytes()
	if len(b) != 65 {
		t.Errorf("Expected 65 bytes, got %d", len(b))
	}
	if b[0] != 0x04 {
		t.Errorf("Expected 0x04 prefix, got 0x%02x", b[0])
	}
}

func TestBytesUncompressed(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)

	b := pk.BytesUncompressed()
	if len(b) != 64 {
		t.Errorf("Expected 64 bytes, got %d", len(b))
	}
	if !bytes.Equal(b[:32], generatorX) {
		t.Error("X coordinate mismatch")
	}
}

func TestBytesCompressed(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)

	b := pk.BytesCompressed()
	if len(b) != 33 {
		t.Errorf("Expected 33 bytes, got %d", len(b))
	}
	if b[0] != 0x02 {
		t.Errorf("Expected 0x02 prefix (even y), got 0x%02x", b[0])
	}
	if !bytes.Equal(b[1:], generatorX) {
		t.Error("X coordinate mismatch")
	}
}

func TestBytesCompressed_OddY(t *testing.T) {
	pk, _ := FromBytes(pk6Compressed)

	b := pk.BytesCompressed()
	if b[0] != 0x03 {
		t.Errorf("Expected 0x03 prefix (odd y), got 0x%02x", b[0])
	}
}

func TestHex(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)

	h := pk.Hex()
	if len(h) != 132 { // "0x" + 130 hex chars
		t.Errorf("Expected 132 chars, got %d", len(h))
	}
	if h[:4] != "0x04" {
		t.Errorf("Expected 0x04 prefix, got %s", h[:4])
	}
}

func TestHexCompressed(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)

	h := pk.HexCompressed()
	if len(h) != 68 { // "0x" + 66 hex chars
		t.Errorf("Expected 68 chars, got %d", len(h))
	}
	if h[:4] != "0x02" {
		t.Errorf("Expected 0x02 prefix, got %s", h[:4])
	}
}

func TestAddress(t *testing.T) {
	// Generator point address (well-known)
	pk, _ := FromBytes(generatorCompressed)
	addr := pk.Address()

	if len(addr.Bytes()) != 20 {
		t.Errorf("Expected 20 bytes, got %d", len(addr.Bytes()))
	}

	// Address should be keccak256(uncompressed64)[12:]
	expectedHex := "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf"
	if addr.Hex() != expectedHex {
		t.Errorf("Address mismatch: got %s, want %s", addr.Hex(), expectedHex)
	}
}

func TestIsValid(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)
	if !pk.IsValid() {
		t.Error("Valid public key should return true")
	}
}

func TestEqual(t *testing.T) {
	pk1, _ := FromBytes(generatorCompressed)
	pk2, _ := FromBytes(generatorCompressed)
	pk3, _ := FromBytes(pk6Compressed)

	if !pk1.Equal(pk2) {
		t.Error("Same keys should be equal")
	}
	if pk1.Equal(pk3) {
		t.Error("Different keys should not be equal")
	}
}

func TestRoundTrip_CompressDecompress(t *testing.T) {
	// Start with compressed
	pk1, _ := FromBytes(generatorCompressed)

	// Get compressed, then parse again
	compressed := pk1.BytesCompressed()
	pk2, _ := FromBytes(compressed)

	if !pk1.Equal(pk2) {
		t.Error("Round trip failed")
	}
}

func TestRoundTrip_UncompressedHex(t *testing.T) {
	pk1, _ := FromBytes(generatorCompressed)

	h := pk1.Hex()
	pk2, _ := FromHex(h)

	if !pk1.Equal(pk2) {
		t.Error("Round trip via uncompressed hex failed")
	}
}

func TestJSONMarshal(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)

	data, err := json.Marshal(pk)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	// Should be compressed hex in quotes
	expected := `"0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"`
	if string(data) != expected {
		t.Errorf("JSON mismatch: got %s, want %s", string(data), expected)
	}
}

func TestJSONUnmarshal_Compressed(t *testing.T) {
	data := []byte(`"0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"`)

	var pk PublicKey
	err := json.Unmarshal(data, &pk)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if !bytes.Equal(pk.BytesUncompressed()[:32], generatorX) {
		t.Error("Unmarshaled key X coordinate mismatch")
	}
}

func TestJSONUnmarshal_Uncompressed(t *testing.T) {
	data := []byte(`"0x0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"`)

	var pk PublicKey
	err := json.Unmarshal(data, &pk)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if !bytes.Equal(pk.BytesUncompressed()[:32], generatorX) {
		t.Error("Unmarshaled key X coordinate mismatch")
	}
}

func TestTextMarshal(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)

	data, err := pk.MarshalText()
	if err != nil {
		t.Fatalf("MarshalText failed: %v", err)
	}

	expected := "0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
	if string(data) != expected {
		t.Errorf("Text mismatch: got %s, want %s", string(data), expected)
	}
}

func TestTextUnmarshal(t *testing.T) {
	var pk PublicKey
	err := pk.UnmarshalText([]byte("0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"))
	if err != nil {
		t.Fatalf("UnmarshalText failed: %v", err)
	}

	if !bytes.Equal(pk.BytesUncompressed()[:32], generatorX) {
		t.Error("X coordinate mismatch")
	}
}

func TestString(t *testing.T) {
	pk, _ := FromBytes(generatorCompressed)
	s := pk.String()

	// String should return compressed hex
	if len(s) != 68 {
		t.Errorf("Expected 68 chars, got %d", len(s))
	}
}

func TestZeroPublicKey(t *testing.T) {
	var pk PublicKey

	// Zero value should have all zero bytes
	if pk.IsValid() {
		t.Error("Zero public key should be invalid (not on curve)")
	}
}

// Benchmark tests
func BenchmarkFromBytes_Compressed(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_, _ = FromBytes(generatorCompressed)
	}
}

func BenchmarkFromBytes_Uncompressed(b *testing.B) {
	input := append(generatorX, generatorY...)
	for i := 0; i < b.N; i++ {
		_, _ = FromBytes(input)
	}
}

func BenchmarkBytesCompressed(b *testing.B) {
	pk, _ := FromBytes(generatorCompressed)
	for i := 0; i < b.N; i++ {
		_ = pk.BytesCompressed()
	}
}

func BenchmarkAddress(b *testing.B) {
	pk, _ := FromBytes(generatorCompressed)
	for i := 0; i < b.N; i++ {
		_ = pk.Address()
	}
}
