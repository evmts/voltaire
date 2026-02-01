package bytes32

import (
	"bytes"
	"encoding/json"
	"testing"
)

func TestFromHex(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:  "valid with prefix",
			input: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		},
		{
			name:  "valid without prefix",
			input: "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		},
		{
			name:  "uppercase",
			input: "0xC5D2460186F7233C927E7DB2DCC703C0E500B653CA82273B7BFAD8045D85A470",
		},
		{
			name:  "mixed case",
			input: "0xC5d2460186f7233c927E7db2dcc703c0E500b653ca82273b7bfad8045d85A470",
		},
		{
			name:  "all zeros",
			input: "0x0000000000000000000000000000000000000000000000000000000000000000",
		},
		{
			name:    "too short",
			input:   "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4",
			wantErr: true,
		},
		{
			name:    "too long",
			input:   "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a47000",
			wantErr: true,
		},
		{
			name:    "invalid hex char",
			input:   "0xgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
			wantErr: true,
		},
		{
			name:    "empty string",
			input:   "",
			wantErr: true,
		},
		{
			name:    "only prefix",
			input:   "0x",
			wantErr: true,
		},
		{
			name:    "odd length",
			input:   "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a47",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := FromHex(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestFromBytes(t *testing.T) {
	tests := []struct {
		name    string
		input   []byte
		wantErr bool
	}{
		{
			name:  "valid 32 bytes",
			input: make([]byte, 32),
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
			name:    "nil",
			input:   nil,
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
			_, err := FromBytes(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestMustFromHex(t *testing.T) {
	t.Run("valid input", func(t *testing.T) {
		b := MustFromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
		if b.IsZero() {
			t.Error("expected non-zero bytes32")
		}
	})

	t.Run("panics on invalid input", func(t *testing.T) {
		defer func() {
			if r := recover(); r == nil {
				t.Error("expected panic, got none")
			}
		}()
		MustFromHex("invalid")
	})
}

func TestHex(t *testing.T) {
	input := "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
	b, err := FromHex(input)
	if err != nil {
		t.Fatalf("FromHex failed: %v", err)
	}

	got := b.Hex()
	if got != input {
		t.Errorf("Hex() = %q, want %q", got, input)
	}

	// Verify lowercase
	upper, _ := FromHex("0xC5D2460186F7233C927E7DB2DCC703C0E500B653CA82273B7BFAD8045D85A470")
	if upper.Hex() != input {
		t.Error("Hex() should return lowercase")
	}
}

func TestBytes(t *testing.T) {
	b, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
	slice := b.Bytes()

	if len(slice) != 32 {
		t.Errorf("Bytes() length = %d, want 32", len(slice))
	}

	// First byte should be 0xc5
	if slice[0] != 0xc5 {
		t.Errorf("first byte = %#x, want 0xc5", slice[0])
	}
}

func TestIsZero(t *testing.T) {
	if !Zero.IsZero() {
		t.Error("Zero should be zero")
	}

	zeroHex, _ := FromHex("0x0000000000000000000000000000000000000000000000000000000000000000")
	if !zeroHex.IsZero() {
		t.Error("zero from hex should be zero")
	}

	nonZero, _ := FromHex("0x0000000000000000000000000000000000000000000000000000000000000001")
	if nonZero.IsZero() {
		t.Error("non-zero should not be zero")
	}

	almostZero, _ := FromHex("0x0100000000000000000000000000000000000000000000000000000000000000")
	if almostZero.IsZero() {
		t.Error("first byte non-zero should not be zero")
	}
}

func TestEqual(t *testing.T) {
	a, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
	b, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
	c, _ := FromHex("0x0000000000000000000000000000000000000000000000000000000000000001")

	if !a.Equal(b) {
		t.Error("same values should be equal")
	}

	if a.Equal(c) {
		t.Error("different values should not be equal")
	}

	if !Zero.Equal(Zero) {
		t.Error("zero should equal zero")
	}
}

func TestCompare(t *testing.T) {
	low, _ := FromHex("0x0000000000000000000000000000000000000000000000000000000000000001")
	high, _ := FromHex("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
	same1, _ := FromHex("0x0000000000000000000000000000000000000000000000000000000000000001")

	if cmp := low.Compare(high); cmp >= 0 {
		t.Errorf("low.Compare(high) = %d, want < 0", cmp)
	}

	if cmp := high.Compare(low); cmp <= 0 {
		t.Errorf("high.Compare(low) = %d, want > 0", cmp)
	}

	if cmp := low.Compare(same1); cmp != 0 {
		t.Errorf("low.Compare(same) = %d, want 0", cmp)
	}

	if cmp := Zero.Compare(Zero); cmp != 0 {
		t.Errorf("Zero.Compare(Zero) = %d, want 0", cmp)
	}
}

func TestString(t *testing.T) {
	b, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")

	// String should return hex
	if b.String() != b.Hex() {
		t.Error("String() should equal Hex()")
	}
}

func TestMarshalText(t *testing.T) {
	b, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")

	text, err := b.MarshalText()
	if err != nil {
		t.Fatalf("MarshalText error: %v", err)
	}

	expected := "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
	if string(text) != expected {
		t.Errorf("MarshalText() = %q, want %q", string(text), expected)
	}
}

func TestUnmarshalText(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:  "valid",
			input: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		},
		{
			name:    "invalid",
			input:   "invalid",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var b Bytes32
			err := b.UnmarshalText([]byte(tt.input))
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestJSONRoundtrip(t *testing.T) {
	original, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")

	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Marshal error: %v", err)
	}

	// Should be quoted hex string
	expected := `"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"`
	if string(data) != expected {
		t.Errorf("Marshal() = %s, want %s", string(data), expected)
	}

	var decoded Bytes32
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal error: %v", err)
	}

	if !original.Equal(decoded) {
		t.Error("roundtrip failed")
	}
}

func TestJSONUnmarshalErrors(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"not a string", `123`},
		{"null", `null`},
		{"array", `[]`},
		{"object", `{}`},
		{"invalid hex", `"invalid"`},
		{"too short", `"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4"`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var b Bytes32
			if err := json.Unmarshal([]byte(tt.input), &b); err == nil {
				t.Error("expected error, got nil")
			}
		})
	}
}

func TestZeroConstant(t *testing.T) {
	// Zero should be all zeros
	for i, b := range Zero {
		if b != 0 {
			t.Errorf("Zero[%d] = %d, want 0", i, b)
		}
	}
}

func TestFromBytesModification(t *testing.T) {
	// Ensure FromBytes creates a copy, not a reference
	original := make([]byte, 32)
	original[0] = 0xff

	b, _ := FromBytes(original)

	// Modify original
	original[0] = 0x00

	// b should still have 0xff
	if b[0] != 0xff {
		t.Error("FromBytes should copy, not reference")
	}
}

func TestBytesReturnsSlice(t *testing.T) {
	b, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")

	slice := b.Bytes()

	// Verify the slice has correct length and content
	if len(slice) != 32 {
		t.Errorf("Bytes() length = %d, want 32", len(slice))
	}
	if slice[0] != 0xc5 {
		t.Errorf("Bytes()[0] = %#x, want 0xc5", slice[0])
	}

	// Note: Since Bytes() is a value receiver method, modifying the returned
	// slice does NOT affect the original Bytes32 (the slice points to a copy).
	// This is the standard Go behavior for value receiver methods.
}

func TestHexRoundtrip(t *testing.T) {
	inputs := []string{
		"0x0000000000000000000000000000000000000000000000000000000000000000",
		"0x0000000000000000000000000000000000000000000000000000000000000001",
		"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
		"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
	}

	for _, input := range inputs {
		t.Run(input, func(t *testing.T) {
			b, err := FromHex(input)
			if err != nil {
				t.Fatalf("FromHex failed: %v", err)
			}

			output := b.Hex()
			if output != input {
				t.Errorf("roundtrip: got %q, want %q", output, input)
			}
		})
	}
}

func TestBytesRoundtrip(t *testing.T) {
	original := make([]byte, 32)
	for i := range original {
		original[i] = byte(i)
	}

	b, err := FromBytes(original)
	if err != nil {
		t.Fatalf("FromBytes failed: %v", err)
	}

	output := b.Bytes()
	if !bytes.Equal(output, original) {
		t.Error("roundtrip failed")
	}
}
