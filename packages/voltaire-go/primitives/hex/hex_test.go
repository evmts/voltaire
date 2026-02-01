package hex

import (
	"bytes"
	"testing"
)

func TestDecode(t *testing.T) {
	tests := []struct {
		input   string
		want    []byte
		wantErr bool
	}{
		{"0x", []byte{}, false},
		{"0x00", []byte{0x00}, false},
		{"0xff", []byte{0xff}, false},
		{"0x0102", []byte{0x01, 0x02}, false},
		{"0xgg", nil, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got, err := Decode(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !bytes.Equal(got, tt.want) {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}

func TestEncode(t *testing.T) {
	tests := []struct {
		input []byte
		want  string
	}{
		{[]byte{}, "0x"},
		{[]byte{0x00}, "0x00"},
		{[]byte{0xff}, "0xff"},
		{[]byte{0x01, 0x02}, "0x0102"},
	}

	for _, tt := range tests {
		got := Encode(tt.input)
		if got != tt.want {
			t.Errorf("Encode(%v) = %s, want %s", tt.input, got, tt.want)
		}
	}
}

func TestRoundtrip(t *testing.T) {
	original := []byte{0xde, 0xad, 0xbe, 0xef}
	encoded := Encode(original)
	decoded, err := Decode(encoded)
	if err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if !bytes.Equal(decoded, original) {
		t.Errorf("roundtrip failed: got %v, want %v", decoded, original)
	}
}

func TestHasPrefix(t *testing.T) {
	if !HasPrefix("0x123") {
		t.Error("0x123 should have prefix")
	}
	if !HasPrefix("0X123") {
		t.Error("0X123 should have prefix")
	}
	if HasPrefix("123") {
		t.Error("123 should not have prefix")
	}
}

func TestTrimPrefix(t *testing.T) {
	if TrimPrefix("0x123") != "123" {
		t.Error("TrimPrefix failed")
	}
	if TrimPrefix("123") != "123" {
		t.Error("TrimPrefix should not modify strings without prefix")
	}
}

func TestAddPrefix(t *testing.T) {
	if AddPrefix("123") != "0x123" {
		t.Error("AddPrefix failed")
	}
	if AddPrefix("0x123") != "0x123" {
		t.Error("AddPrefix should not double-prefix")
	}
}
