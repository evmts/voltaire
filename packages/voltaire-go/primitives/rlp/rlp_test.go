package rlp

import (
	"bytes"
	"encoding/hex"
	"math/big"
	"testing"
)

// Helper to decode hex string to bytes
func hexToBytes(s string) []byte {
	b, _ := hex.DecodeString(s)
	return b
}

// Helper to encode bytes to hex string
func bytesToHex(b []byte) string {
	return hex.EncodeToString(b)
}

// =============================================================================
// Encoding Tests - Ethereum Wiki Test Vectors
// =============================================================================

func TestEncodeSingleByte(t *testing.T) {
	tests := []struct {
		name  string
		input []byte
		want  string
	}{
		{"byte 0x00", []byte{0x00}, "00"},
		{"byte 0x0f", []byte{0x0f}, "0f"},
		{"byte 0x7f", []byte{0x7f}, "7f"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Encode(tt.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if bytesToHex(got) != tt.want {
				t.Errorf("got %s, want %s", bytesToHex(got), tt.want)
			}
		})
	}
}

func TestEncodeSingleByteWithPrefix(t *testing.T) {
	// Single byte >= 0x80 needs length prefix
	tests := []struct {
		name  string
		input []byte
		want  string
	}{
		{"byte 0x80", []byte{0x80}, "8180"},
		{"byte 0xff", []byte{0xff}, "81ff"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Encode(tt.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if bytesToHex(got) != tt.want {
				t.Errorf("got %s, want %s", bytesToHex(got), tt.want)
			}
		})
	}
}

func TestEncodeEmptyString(t *testing.T) {
	got, err := Encode([]byte{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bytesToHex(got) != "80" {
		t.Errorf("got %s, want 80", bytesToHex(got))
	}
}

func TestEncodeShortString(t *testing.T) {
	tests := []struct {
		name  string
		input []byte
		want  string
	}{
		{"dog", []byte("dog"), "83646f67"},
		{"cat", []byte("cat"), "83636174"},
		{"hello", []byte("hello"), "8568656c6c6f"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Encode(tt.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if bytesToHex(got) != tt.want {
				t.Errorf("got %s, want %s", bytesToHex(got), tt.want)
			}
		})
	}
}

func TestEncode55ByteString(t *testing.T) {
	// Boundary case: exactly 55 bytes uses short form (0x80 + 55 = 0xb7)
	input := bytes.Repeat([]byte{'a'}, 55)
	got, err := Encode(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got[0] != 0xb7 {
		t.Errorf("got prefix %#x, want 0xb7", got[0])
	}
	if len(got) != 56 {
		t.Errorf("got length %d, want 56", len(got))
	}
}

func TestEncode56ByteString(t *testing.T) {
	// Boundary case: 56 bytes uses long form (0xb8 + 1 byte length)
	input := bytes.Repeat([]byte{'a'}, 56)
	got, err := Encode(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got[0] != 0xb8 {
		t.Errorf("got prefix %#x, want 0xb8", got[0])
	}
	if got[1] != 56 {
		t.Errorf("got length byte %d, want 56", got[1])
	}
	if len(got) != 58 {
		t.Errorf("got total length %d, want 58", len(got))
	}
}

func TestEncodeLongString(t *testing.T) {
	// 70 byte string
	input := []byte("zoo255zoo255zzzzzzzzzzzzssssssssssssssssssssssssssssssssssssssssssssss")
	got, err := Encode(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got[0] != 0xb8 {
		t.Errorf("got prefix %#x, want 0xb8", got[0])
	}
	if got[1] != 70 {
		t.Errorf("got length byte %d, want 70", got[1])
	}
}

func TestEncodeEmptyList(t *testing.T) {
	got, err := EncodeList([]interface{}{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bytesToHex(got) != "c0" {
		t.Errorf("got %s, want c0", bytesToHex(got))
	}
}

func TestEncodeShortList(t *testing.T) {
	// ["cat", "dog"]
	got, err := EncodeList([]interface{}{
		[]byte("cat"),
		[]byte("dog"),
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// c8 = 0xc0 + 8 (total payload length)
	// 83636174 = "cat"
	// 83646f67 = "dog"
	if bytesToHex(got) != "c88363617483646f67" {
		t.Errorf("got %s, want c88363617483646f67", bytesToHex(got))
	}
}

func TestEncodeNestedList(t *testing.T) {
	// [[], [[]], [[], [[]]]]
	got, err := EncodeList([]interface{}{
		[]interface{}{},                       // []
		[]interface{}{[]interface{}{}},        // [[]]
		[]interface{}{[]interface{}{}, []interface{}{[]interface{}{}}}, // [[], [[]]]
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// c7 c0 c1c0 c3c0c1c0
	if bytesToHex(got) != "c7c0c1c0c3c0c1c0" {
		t.Errorf("got %s, want c7c0c1c0c3c0c1c0", bytesToHex(got))
	}
}

func TestEncodeSetTheoretical(t *testing.T) {
	// Set theoretical representation of three
	// [ [], [[]], [ [], [[]] ] ]
	got, err := EncodeList([]interface{}{
		[]interface{}{},
		[]interface{}{[]interface{}{}},
		[]interface{}{[]interface{}{}, []interface{}{[]interface{}{}}},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bytesToHex(got) != "c7c0c1c0c3c0c1c0" {
		t.Errorf("got %s, want c7c0c1c0c3c0c1c0", bytesToHex(got))
	}
}

func TestEncodeLongList(t *testing.T) {
	// Create list with >55 bytes payload
	items := make([]interface{}, 20)
	for i := range items {
		items[i] = []byte("cat")
	}
	got, err := EncodeList(items)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Should use long list form (0xf8)
	if got[0] != 0xf8 {
		t.Errorf("got prefix %#x, want 0xf8", got[0])
	}
}

// =============================================================================
// Integer Encoding Tests
// =============================================================================

func TestEncodeUint64(t *testing.T) {
	tests := []struct {
		name  string
		input uint64
		want  string
	}{
		{"zero", 0, "80"},          // zero = empty string
		{"one", 1, "01"},           // single byte
		{"127", 127, "7f"},         // max single byte
		{"128", 128, "8180"},       // needs prefix
		{"255", 255, "81ff"},       // needs prefix
		{"256", 256, "820100"},     // two bytes
		{"1024", 1024, "820400"},   // two bytes
		{"1000000", 1000000, "830f4240"}, // three bytes
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := EncodeUint64(tt.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if bytesToHex(got) != tt.want {
				t.Errorf("got %s, want %s", bytesToHex(got), tt.want)
			}
		})
	}
}

func TestEncodeBigInt(t *testing.T) {
	tests := []struct {
		name  string
		input *big.Int
		want  string
	}{
		{"zero", big.NewInt(0), "80"},
		{"one", big.NewInt(1), "01"},
		{"127", big.NewInt(127), "7f"},
		{"128", big.NewInt(128), "8180"},
		{"256", big.NewInt(256), "820100"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := EncodeBigInt(tt.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if bytesToHex(got) != tt.want {
				t.Errorf("got %s, want %s", bytesToHex(got), tt.want)
			}
		})
	}
}

func TestEncodeBigIntLarge(t *testing.T) {
	// 2^256 - 1
	maxU256 := new(big.Int)
	maxU256.SetString("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", 16)

	got, err := EncodeBigInt(maxU256)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// 0xa0 = 0x80 + 32 (32 bytes)
	if got[0] != 0xa0 {
		t.Errorf("got prefix %#x, want 0xa0", got[0])
	}
	if len(got) != 33 {
		t.Errorf("got length %d, want 33", len(got))
	}
}

// =============================================================================
// Decoding Tests
// =============================================================================

func TestDecodeSingleByte(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  []byte
	}{
		{"byte 0x00", "00", []byte{0x00}},
		{"byte 0x7f", "7f", []byte{0x7f}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := DecodeBytes(hexToBytes(tt.input))
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			b, ok := got.([]byte)
			if !ok {
				t.Fatalf("expected []byte, got %T", got)
			}
			if !bytes.Equal(b, tt.want) {
				t.Errorf("got %v, want %v", b, tt.want)
			}
		})
	}
}

func TestDecodeEmptyString(t *testing.T) {
	got, err := DecodeBytes(hexToBytes("80"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	b, ok := got.([]byte)
	if !ok {
		t.Fatalf("expected []byte, got %T", got)
	}
	if len(b) != 0 {
		t.Errorf("expected empty slice, got %v", b)
	}
}

func TestDecodeShortString(t *testing.T) {
	got, err := DecodeBytes(hexToBytes("83646f67"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	b, ok := got.([]byte)
	if !ok {
		t.Fatalf("expected []byte, got %T", got)
	}
	if string(b) != "dog" {
		t.Errorf("got %s, want dog", string(b))
	}
}

func TestDecodeLongString(t *testing.T) {
	// 56 bytes: 0xb8 0x38 + 56 bytes
	input := append([]byte{0xb8, 56}, bytes.Repeat([]byte{'a'}, 56)...)
	got, err := DecodeBytes(input)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	b, ok := got.([]byte)
	if !ok {
		t.Fatalf("expected []byte, got %T", got)
	}
	if len(b) != 56 {
		t.Errorf("got length %d, want 56", len(b))
	}
}

func TestDecodeEmptyList(t *testing.T) {
	got, err := DecodeBytes(hexToBytes("c0"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	list, ok := got.([]interface{})
	if !ok {
		t.Fatalf("expected []interface{}, got %T", got)
	}
	if len(list) != 0 {
		t.Errorf("expected empty list, got %v", list)
	}
}

func TestDecodeShortList(t *testing.T) {
	// ["cat", "dog"]
	got, err := DecodeBytes(hexToBytes("c88363617483646f67"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	list, ok := got.([]interface{})
	if !ok {
		t.Fatalf("expected []interface{}, got %T", got)
	}
	if len(list) != 2 {
		t.Fatalf("expected 2 items, got %d", len(list))
	}
	if string(list[0].([]byte)) != "cat" {
		t.Errorf("first item: got %s, want cat", string(list[0].([]byte)))
	}
	if string(list[1].([]byte)) != "dog" {
		t.Errorf("second item: got %s, want dog", string(list[1].([]byte)))
	}
}

func TestDecodeNestedList(t *testing.T) {
	// [[], [[]], [[], [[]]]]
	got, err := DecodeBytes(hexToBytes("c7c0c1c0c3c0c1c0"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	list, ok := got.([]interface{})
	if !ok {
		t.Fatalf("expected []interface{}, got %T", got)
	}
	if len(list) != 3 {
		t.Fatalf("expected 3 items, got %d", len(list))
	}

	// First: []
	first, ok := list[0].([]interface{})
	if !ok || len(first) != 0 {
		t.Errorf("first item should be empty list")
	}

	// Second: [[]]
	second, ok := list[1].([]interface{})
	if !ok || len(second) != 1 {
		t.Errorf("second item should have 1 element")
	}
}

// =============================================================================
// Decode Error Tests
// =============================================================================

func TestDecodeInputTooShort(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"truncated string", "8568656c"},      // claims 5 bytes, only 3
		{"truncated list", "c38363"},          // claims 3 bytes, only 2
		{"truncated long string header", "b8"}, // missing length byte
		{"truncated long list header", "f8"},   // missing length byte
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := DecodeBytes(hexToBytes(tt.input))
			if err == nil {
				t.Error("expected error, got nil")
			}
		})
	}
}

func TestDecodeNonCanonical(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"single byte with prefix", "8100"},    // 0x00 should be just 0x00
		{"single byte 0x7f with prefix", "817f"}, // 0x7f should be just 0x7f
		{"leading zeros in length", "b8000568656c6c6f"}, // leading zero in length
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := DecodeBytes(hexToBytes(tt.input))
			if err == nil {
				t.Error("expected error for non-canonical encoding")
			}
		})
	}
}

func TestDecodeExtraBytes(t *testing.T) {
	// Valid RLP followed by extra bytes should error
	_, err := DecodeBytes(hexToBytes("83646f67ff"))
	if err == nil {
		t.Error("expected error for extra bytes")
	}
}

// =============================================================================
// Round-trip Tests
// =============================================================================

func TestRoundTrip(t *testing.T) {
	tests := []struct {
		name  string
		input interface{}
	}{
		{"empty bytes", []byte{}},
		{"single byte", []byte{0x42}},
		{"short string", []byte("hello")},
		{"long string", bytes.Repeat([]byte{'x'}, 100)},
		{"empty list", []interface{}{}},
		{"simple list", []interface{}{[]byte("a"), []byte("b")}},
		{"nested list", []interface{}{[]interface{}{}, []interface{}{[]byte("x")}}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var encoded []byte
			var err error

			switch v := tt.input.(type) {
			case []byte:
				encoded, err = Encode(v)
			case []interface{}:
				encoded, err = EncodeList(v)
			}
			if err != nil {
				t.Fatalf("encode error: %v", err)
			}

			decoded, err := DecodeBytes(encoded)
			if err != nil {
				t.Fatalf("decode error: %v", err)
			}

			// Compare based on type
			switch expected := tt.input.(type) {
			case []byte:
				got, ok := decoded.([]byte)
				if !ok {
					t.Fatalf("expected []byte, got %T", decoded)
				}
				if !bytes.Equal(got, expected) {
					t.Errorf("round-trip failed: got %v, want %v", got, expected)
				}
			case []interface{}:
				// Just verify it decoded to a list of same length
				got, ok := decoded.([]interface{})
				if !ok {
					t.Fatalf("expected []interface{}, got %T", decoded)
				}
				if len(got) != len(expected) {
					t.Errorf("list length: got %d, want %d", len(got), len(expected))
				}
			}
		})
	}
}

// =============================================================================
// Hex Encoding Tests
// =============================================================================

func TestEncodeToHex(t *testing.T) {
	got, err := EncodeToHex([]byte("dog"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "0x83646f67" {
		t.Errorf("got %s, want 0x83646f67", got)
	}
}

// =============================================================================
// Stream Decoding Tests
// =============================================================================

func TestDecodeStream(t *testing.T) {
	// Multiple RLP items concatenated
	data := hexToBytes("83636174" + "83646f67") // "cat" + "dog"

	// First decode
	item1, remainder, err := DecodeWithRemainder(data)
	if err != nil {
		t.Fatalf("first decode error: %v", err)
	}
	if string(item1.([]byte)) != "cat" {
		t.Errorf("first item: got %s, want cat", string(item1.([]byte)))
	}

	// Second decode
	item2, remainder, err := DecodeWithRemainder(remainder)
	if err != nil {
		t.Fatalf("second decode error: %v", err)
	}
	if string(item2.([]byte)) != "dog" {
		t.Errorf("second item: got %s, want dog", string(item2.([]byte)))
	}

	// Should be empty
	if len(remainder) != 0 {
		t.Errorf("expected empty remainder, got %d bytes", len(remainder))
	}
}

// =============================================================================
// Validation Tests
// =============================================================================

func TestIsValid(t *testing.T) {
	tests := []struct {
		name  string
		input string
		valid bool
	}{
		{"empty string", "80", true},
		{"single byte", "42", true},
		{"short string", "83646f67", true},
		{"empty list", "c0", true},
		{"truncated", "8568", false},
		{"non-canonical", "8100", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsValid(hexToBytes(tt.input))
			if got != tt.valid {
				t.Errorf("got %v, want %v", got, tt.valid)
			}
		})
	}
}

// =============================================================================
// Benchmarks
// =============================================================================

func BenchmarkEncodeShortString(b *testing.B) {
	data := []byte("hello world")
	for i := 0; i < b.N; i++ {
		Encode(data)
	}
}

func BenchmarkEncodeLongString(b *testing.B) {
	data := bytes.Repeat([]byte{'a'}, 1024)
	for i := 0; i < b.N; i++ {
		Encode(data)
	}
}

func BenchmarkEncodeList(b *testing.B) {
	items := []interface{}{
		[]byte("cat"),
		[]byte("dog"),
		[]byte("elephant"),
	}
	for i := 0; i < b.N; i++ {
		EncodeList(items)
	}
}

func BenchmarkDecodeShortString(b *testing.B) {
	data := hexToBytes("8b68656c6c6f20776f726c64")
	for i := 0; i < b.N; i++ {
		DecodeBytes(data)
	}
}

func BenchmarkDecodeList(b *testing.B) {
	data := hexToBytes("cc8363617483646f678868656c6c6f")
	for i := 0; i < b.N; i++ {
		DecodeBytes(data)
	}
}
