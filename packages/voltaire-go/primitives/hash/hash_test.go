package hash

import (
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
			name:  "valid hash",
			input: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		},
		{
			name:  "without prefix",
			input: "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		},
		{
			name:    "too short",
			input:   "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4",
			wantErr: true,
		},
		{
			name:    "invalid hex",
			input:   "0xgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg",
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

func TestEqual(t *testing.T) {
	a, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
	b, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
	c, _ := FromHex("0x0000000000000000000000000000000000000000000000000000000000000001")

	if !a.Equal(b) {
		t.Error("same hashes should be equal")
	}
	if a.Equal(c) {
		t.Error("different hashes should not be equal")
	}
}

func TestIsZero(t *testing.T) {
	if !Zero.IsZero() {
		t.Error("Zero should be zero")
	}

	h, _ := FromHex("0x0000000000000000000000000000000000000000000000000000000000000001")
	if h.IsZero() {
		t.Error("non-zero hash should not be zero")
	}
}

func TestJSONRoundtrip(t *testing.T) {
	original, _ := FromHex("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")

	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Marshal error: %v", err)
	}

	var decoded Hash
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal error: %v", err)
	}

	if !original.Equal(decoded) {
		t.Error("roundtrip failed")
	}
}
