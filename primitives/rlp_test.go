package primitives

import (
	"bytes"
	"encoding/hex"
	"math/big"
	"testing"
)

// Helper function to decode hex strings
func hexDecode(s string) []byte {
	if len(s) >= 2 && s[0:2] == "0x" {
		s = s[2:]
	}
	data, err := hex.DecodeString(s)
	if err != nil {
		panic(err)
	}
	return data
}

// Helper function to encode hex strings
func hexEncode(data []byte) string {
	return "0x" + hex.EncodeToString(data)
}

// Test single byte encoding
func TestRlpSingleByte(t *testing.T) {
	// Single byte < 0x80 encodes as itself
	input := []byte{'a'}
	encoded, err := Encode(input)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	if !bytes.Equal(encoded, []byte{'a'}) {
		t.Errorf("Expected [a], got %v", encoded)
	}

	// Decode and verify
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	str, ok := decoded.(RlpString)
	if !ok {
		t.Fatalf("Expected RlpString, got %T", decoded)
	}

	if !bytes.Equal([]byte(str), []byte{'a'}) {
		t.Errorf("Expected [a], got %v", str)
	}
}

// Test empty string encoding
func TestRlpEmptyString(t *testing.T) {
	input := []byte{}
	encoded, err := Encode(input)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	expected := []byte{0x80}
	if !bytes.Equal(encoded, expected) {
		t.Errorf("Expected %v, got %v", expected, encoded)
	}

	// Decode and verify
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	str, ok := decoded.(RlpString)
	if !ok {
		t.Fatalf("Expected RlpString, got %T", decoded)
	}

	if len(str) != 0 {
		t.Errorf("Expected empty string, got %v", str)
	}
}

// Test short string encoding (0-55 bytes)
func TestRlpShortString(t *testing.T) {
	input := "dog"
	encoded, err := Encode(input)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// "dog" = 3 bytes -> 0x83 + "dog"
	expected := []byte{0x83, 'd', 'o', 'g'}
	if !bytes.Equal(encoded, expected) {
		t.Errorf("Expected %v, got %v", expected, encoded)
	}

	// Decode and verify
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	str, ok := decoded.(RlpString)
	if !ok {
		t.Fatalf("Expected RlpString, got %T", decoded)
	}

	if string(str) != "dog" {
		t.Errorf("Expected 'dog', got '%s'", str)
	}
}

// Test long string encoding (>55 bytes)
func TestRlpLongString(t *testing.T) {
	// 70 character string
	input := "zoo255zoo255zzzzzzzzzzzzssssssssssssssssssssssssssssssssssssssssssssss"
	encoded, err := Encode(input)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// Length = 70 = 0x46, needs 1 byte to encode
	// Prefix = 0xb7 + 1 = 0xb8
	if encoded[0] != 0xb8 {
		t.Errorf("Expected prefix 0xb8, got 0x%x", encoded[0])
	}
	if encoded[1] != 0x46 {
		t.Errorf("Expected length 0x46, got 0x%x", encoded[1])
	}

	// Decode and verify
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	str, ok := decoded.(RlpString)
	if !ok {
		t.Fatalf("Expected RlpString, got %T", decoded)
	}

	if string(str) != input {
		t.Errorf("Decoded string doesn't match input")
	}
}

// Test short list encoding
func TestRlpShortList(t *testing.T) {
	items := []RlpData{
		RlpString("dog"),
		RlpString("god"),
		RlpString("cat"),
	}

	encoded, err := Encode(items)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// Each string: 0x83 + 3 bytes = 4 bytes
	// Total payload: 12 bytes
	// Prefix: 0xc0 + 12 = 0xcc
	if encoded[0] != 0xcc {
		t.Errorf("Expected prefix 0xcc, got 0x%x", encoded[0])
	}

	// Decode and verify
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	list, ok := decoded.(RlpList)
	if !ok {
		t.Fatalf("Expected RlpList, got %T", decoded)
	}

	if len(list) != 3 {
		t.Errorf("Expected 3 items, got %d", len(list))
	}

	expected := []string{"dog", "god", "cat"}
	for i, item := range list {
		str, ok := item.(RlpString)
		if !ok {
			t.Fatalf("Expected RlpString at index %d, got %T", i, item)
		}
		if string(str) != expected[i] {
			t.Errorf("Expected '%s' at index %d, got '%s'", expected[i], i, str)
		}
	}
}

// Test empty list encoding
func TestRlpEmptyList(t *testing.T) {
	items := []RlpData{}
	encoded, err := Encode(items)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	expected := []byte{0xc0}
	if !bytes.Equal(encoded, expected) {
		t.Errorf("Expected %v, got %v", expected, encoded)
	}

	// Decode and verify
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	list, ok := decoded.(RlpList)
	if !ok {
		t.Fatalf("Expected RlpList, got %T", decoded)
	}

	if len(list) != 0 {
		t.Errorf("Expected empty list, got %d items", len(list))
	}
}

// Test integer encoding
func TestRlpInteger(t *testing.T) {
	tests := []struct {
		name     string
		input    uint64
		expected []byte
	}{
		{"zero", 0, []byte{0x80}},
		{"one", 1, []byte{0x01}},
		{"fifteen", 15, []byte{0x0f}},
		{"1024", 1024, []byte{0x82, 0x04, 0x00}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encoded, err := Encode(tt.input)
			if err != nil {
				t.Fatalf("Encode failed: %v", err)
			}

			if !bytes.Equal(encoded, tt.expected) {
				t.Errorf("Expected %v, got %v", tt.expected, encoded)
			}
		})
	}
}

// Test big.Int encoding
func TestRlpBigInt(t *testing.T) {
	tests := []struct {
		name  string
		input *big.Int
	}{
		{"zero", big.NewInt(0)},
		{"small", big.NewInt(127)},
		{"medium", big.NewInt(65535)},
		{"large", new(big.Int).SetBytes(bytes.Repeat([]byte{0xff}, 32))},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encoded, err := Encode(tt.input)
			if err != nil {
				t.Fatalf("Encode failed: %v", err)
			}

			// Verify we can decode it back
			decoded, err := Decode(encoded)
			if err != nil {
				t.Fatalf("Decode failed: %v", err)
			}

			str, ok := decoded.(RlpString)
			if !ok {
				t.Fatalf("Expected RlpString, got %T", decoded)
			}

			// Convert back to big.Int
			result := new(big.Int).SetBytes([]byte(str))
			if tt.input.Cmp(result) != 0 {
				t.Errorf("Expected %v, got %v", tt.input, result)
			}
		})
	}
}

// Test nested lists
func TestRlpNestedLists(t *testing.T) {
	// [[]]
	innerList := []RlpData{}
	outerList := []RlpData{RlpList(innerList)}

	encoded, err := Encode(outerList)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// Inner list: 0xc0
	// Outer list: 0xc1 + 0xc0
	expected := []byte{0xc1, 0xc0}
	if !bytes.Equal(encoded, expected) {
		t.Errorf("Expected %v, got %v", expected, encoded)
	}

	// Decode and verify
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	list, ok := decoded.(RlpList)
	if !ok {
		t.Fatalf("Expected RlpList, got %T", decoded)
	}

	if len(list) != 1 {
		t.Errorf("Expected 1 item, got %d", len(list))
	}

	inner, ok := list[0].(RlpList)
	if !ok {
		t.Fatalf("Expected inner RlpList, got %T", list[0])
	}

	if len(inner) != 0 {
		t.Errorf("Expected empty inner list, got %d items", len(inner))
	}
}

// Test stream decoding
func TestRlpStreamDecoding(t *testing.T) {
	// Create a stream of multiple RLP items
	item1, _ := Encode("first")
	item2, _ := Encode("second")
	item3, _ := Encode("third")

	stream := append(item1, item2...)
	stream = append(stream, item3...)

	// Decode stream item by item
	remaining := stream

	decoded1, rem, err := DecodeStream(remaining)
	if err != nil {
		t.Fatalf("DecodeStream failed: %v", err)
	}
	str1, ok := decoded1.(RlpString)
	if !ok || string(str1) != "first" {
		t.Errorf("Expected 'first', got %v", decoded1)
	}
	remaining = rem

	decoded2, rem, err := DecodeStream(remaining)
	if err != nil {
		t.Fatalf("DecodeStream failed: %v", err)
	}
	str2, ok := decoded2.(RlpString)
	if !ok || string(str2) != "second" {
		t.Errorf("Expected 'second', got %v", decoded2)
	}
	remaining = rem

	decoded3, rem, err := DecodeStream(remaining)
	if err != nil {
		t.Fatalf("DecodeStream failed: %v", err)
	}
	str3, ok := decoded3.(RlpString)
	if !ok || string(str3) != "third" {
		t.Errorf("Expected 'third', got %v", decoded3)
	}
	remaining = rem

	if len(remaining) != 0 {
		t.Errorf("Expected empty remainder, got %d bytes", len(remaining))
	}
}

// Test official Ethereum test vectors
func TestRlpEthereumVectors(t *testing.T) {
	tests := []struct {
		name     string
		input    interface{}
		expected string
	}{
		{"empty string", "", "0x80"},
		{"single byte 0x00", []byte{0x00}, "0x00"},
		{"single byte 0x7f", []byte{0x7f}, "0x7f"},
		{"dog", "dog", "0x83646f67"},
		{"cat and dog", []RlpData{RlpString("cat"), RlpString("dog")}, "0xc88363617483646f67"},
		{"empty list", []RlpData{}, "0xc0"},
		{"list with empty items", []RlpData{RlpString(""), RlpString("")}, "0xc28080"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encoded, err := Encode(tt.input)
			if err != nil {
				t.Fatalf("Encode failed: %v", err)
			}

			expected := hexDecode(tt.expected)
			if !bytes.Equal(encoded, expected) {
				t.Errorf("Expected %s, got %s", hexEncode(expected), hexEncode(encoded))
			}

			// Verify we can decode it back
			_, err = Decode(encoded)
			if err != nil {
				t.Fatalf("Decode failed: %v", err)
			}
		})
	}
}

// Test error cases
func TestRlpErrors(t *testing.T) {
	tests := []struct {
		name        string
		input       []byte
		expectedErr error
	}{
		{"empty input", []byte{}, ErrInputTooShort},
		{"truncated short string", []byte{0x85, 0x01, 0x02}, ErrInputTooShort},
		{"truncated long string", []byte{0xb8, 0x10}, ErrInputTooShort},
		{"leading zeros in length", []byte{0xb8, 0x00, 0x01}, ErrLeadingZeros},
		{"non-canonical short encoding", []byte{0x81, 0x01}, ErrNonCanonicalSize},
		{"trailing bytes", append([]byte{0x80}, 0x01), ErrInvalidRemainder},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Decode(tt.input)
			if err == nil {
				t.Errorf("Expected error %v, got nil", tt.expectedErr)
			}
			if err != tt.expectedErr {
				t.Errorf("Expected error %v, got %v", tt.expectedErr, err)
			}
		})
	}
}

// Test recursion depth limit
func TestRlpRecursionDepth(t *testing.T) {
	// Create deeply nested list exceeding MaxRLPDepth
	current, _ := Encode("inner")

	for i := 0; i < MaxRLPDepth+5; i++ {
		list := []RlpData{RlpString(current)}
		var err error
		current, err = Encode(list)
		if err != nil {
			t.Fatalf("Encode failed at depth %d: %v", i, err)
		}
	}

	// Decoding should fail with recursion error
	_, err := Decode(current)
	if err != ErrRecursionExceeded {
		t.Errorf("Expected ErrRecursionExceeded, got %v", err)
	}
}

// Test IsValidRlpEncoding helper
func TestRlpIsValid(t *testing.T) {
	validData, _ := Encode("test")
	if !IsValidRlpEncoding(validData) {
		t.Error("Expected valid data to return true")
	}

	invalidData := []byte{0x85, 0x01} // Truncated
	if IsValidRlpEncoding(invalidData) {
		t.Error("Expected invalid data to return false")
	}
}

// Benchmark encoding
func BenchmarkRlpEncode(b *testing.B) {
	data := "The quick brown fox jumps over the lazy dog"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = Encode(data)
	}
}

// Benchmark decoding
func BenchmarkRlpDecode(b *testing.B) {
	data := "The quick brown fox jumps over the lazy dog"
	encoded, _ := Encode(data)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = Decode(encoded)
	}
}
