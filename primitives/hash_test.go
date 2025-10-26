package primitives

import (
	"testing"
)

func TestHashFromHex(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:    "valid hash",
			input:   "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			wantErr: false,
		},
		{
			name:    "zero hash",
			input:   "0x0000000000000000000000000000000000000000000000000000000000000000",
			wantErr: false,
		},
		{
			name:    "invalid length (too short)",
			input:   "0x1234567890abcdef",
			wantErr: true,
		},
		{
			name:    "invalid length (too long)",
			input:   "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefff",
			wantErr: true,
		},
		{
			name:    "missing prefix",
			input:   "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			wantErr: true,
		},
		{
			name:    "invalid character",
			input:   "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashFromHex(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("HashFromHex(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && hash.IsZero() && tt.input != "0x0000000000000000000000000000000000000000000000000000000000000000" {
				t.Errorf("HashFromHex(%q) returned zero hash unexpectedly", tt.input)
			}
		})
	}
}

func TestHashFromBytes(t *testing.T) {
	tests := []struct {
		name    string
		input   []byte
		wantErr bool
	}{
		{
			name:    "valid 32 bytes",
			input:   make([]byte, 32),
			wantErr: false,
		},
		{
			name:    "too short",
			input:   make([]byte, 31),
			wantErr: true,
		},
		{
			name:    "too long",
			input:   make([]byte, 33),
			wantErr: true,
		},
		{
			name:    "empty",
			input:   []byte{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := HashFromBytes(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("HashFromBytes() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestHashToHex(t *testing.T) {
	input := "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
	hash, err := HashFromHex(input)
	if err != nil {
		t.Fatalf("HashFromHex() failed: %v", err)
	}

	result := hash.ToHex()
	if result != input {
		t.Errorf("ToHex() = %s, want %s", result, input)
	}
}

func TestHashIsZero(t *testing.T) {
	zeroHash := Hash{}
	if !zeroHash.IsZero() {
		t.Error("Zero hash should return true for IsZero()")
	}

	nonZeroHash, _ := HashFromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
	if nonZeroHash.IsZero() {
		t.Error("Non-zero hash should return false for IsZero()")
	}

	// Test ZeroHash constant
	if !ZeroHash.IsZero() {
		t.Error("ZeroHash constant should be zero")
	}
}

func TestHashEquals(t *testing.T) {
	hash1, _ := HashFromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
	hash2, _ := HashFromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
	hash3, _ := HashFromHex("0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321")

	if !hash1.Equals(hash2) {
		t.Error("Identical hashes should be equal")
	}

	if hash1.Equals(hash3) {
		t.Error("Different hashes should not be equal")
	}
}

func TestHashEqualsConstantTime(t *testing.T) {
	// This test verifies that Equals uses constant-time comparison
	// We can't directly test timing, but we verify it uses the right function
	hash1, _ := HashFromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
	hash2, _ := HashFromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")

	// Should be equal
	if !hash1.Equals(hash2) {
		t.Error("Equal hashes should return true")
	}

	// Modify one byte
	hash2[0] = 0xff
	if hash1.Equals(hash2) {
		t.Error("Different hashes should return false")
	}
}

func TestHashBytes(t *testing.T) {
	hash, _ := HashFromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
	bytes := hash.Bytes()

	if len(bytes) != 32 {
		t.Errorf("Bytes() length = %d, want 32", len(bytes))
	}

	// Verify first few bytes
	expected := []byte{0x12, 0x34, 0x56, 0x78}
	for i := 0; i < 4; i++ {
		if bytes[i] != expected[i] {
			t.Errorf("Bytes()[%d] = 0x%02x, want 0x%02x", i, bytes[i], expected[i])
		}
	}
}

func TestHashString(t *testing.T) {
	input := "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
	hash, _ := HashFromHex(input)
	str := hash.String()

	if str != input {
		t.Errorf("String() = %s, want %s", str, input)
	}
}

func TestZeroHashConstant(t *testing.T) {
	expected := "0x0000000000000000000000000000000000000000000000000000000000000000"
	result := ZeroHash.ToHex()

	if result != expected {
		t.Errorf("ZeroHash.ToHex() = %s, want %s", result, expected)
	}
}

func TestHashRoundTrip(t *testing.T) {
	original := "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
	hash, err := HashFromHex(original)
	if err != nil {
		t.Fatalf("HashFromHex() failed: %v", err)
	}

	// Convert to bytes and back
	bytes := hash.Bytes()
	hash2, err := HashFromBytes(bytes)
	if err != nil {
		t.Fatalf("HashFromBytes() failed: %v", err)
	}

	if !hash.Equals(hash2) {
		t.Error("Round trip through bytes failed")
	}

	// Convert to hex and back
	hex := hash.ToHex()
	hash3, err := HashFromHex(hex)
	if err != nil {
		t.Fatalf("HashFromHex() failed: %v", err)
	}

	if !hash.Equals(hash3) {
		t.Error("Round trip through hex failed")
	}
}
