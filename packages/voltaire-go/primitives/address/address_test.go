package address

import (
	"encoding/json"
	"testing"
)

func TestFromHex(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{
			name:  "lowercase with prefix",
			input: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
			want:  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
		},
		{
			name:  "checksummed",
			input: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
			want:  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
		},
		{
			name:  "without prefix",
			input: "d8da6bf26964af9d7eed9e03e53415d37aa96045",
			want:  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
		},
		{
			name:  "zero address",
			input: "0x0000000000000000000000000000000000000000",
			want:  "0x0000000000000000000000000000000000000000",
		},
		{
			name:    "too short",
			input:   "0xd8da6bf26964af9d7eed9e03e53415d37aa960",
			wantErr: true,
		},
		{
			name:    "invalid hex",
			input:   "0xgggggggggggggggggggggggggggggggggggggggg",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addr, err := FromHex(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			got := addr.ChecksumHex()
			if got != tt.want {
				t.Errorf("got %s, want %s", got, tt.want)
			}
		})
	}
}

func TestIsZero(t *testing.T) {
	zero := Zero
	if !zero.IsZero() {
		t.Error("Zero address should be zero")
	}

	addr, _ := FromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
	if addr.IsZero() {
		t.Error("Non-zero address should not be zero")
	}
}

func TestEqual(t *testing.T) {
	a, _ := FromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
	b, _ := FromHex("0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045")
	c, _ := FromHex("0x0000000000000000000000000000000000000001")

	if !a.Equal(b) {
		t.Error("same addresses should be equal")
	}
	if a.Equal(c) {
		t.Error("different addresses should not be equal")
	}
}

func TestValidateChecksum(t *testing.T) {
	tests := []struct {
		input string
		valid bool
	}{
		{"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", true},
		{"0xd8da6bf26964af9d7eed9e03e53415d37aa96045", false}, // all lowercase
		{"0xD8DA6BF26964AF9D7EED9E03E53415D37AA96045", false}, // all uppercase
		{"0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed", true},  // vitalik.eth checksum
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := ValidateChecksum(tt.input)
			if got != tt.valid {
				t.Errorf("ValidateChecksum(%s) = %v, want %v", tt.input, got, tt.valid)
			}
		})
	}
}

func TestJSONMarshal(t *testing.T) {
	addr, _ := FromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045")

	data, err := json.Marshal(addr)
	if err != nil {
		t.Fatalf("Marshal error: %v", err)
	}

	want := `"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"`
	if string(data) != want {
		t.Errorf("got %s, want %s", string(data), want)
	}
}

func TestJSONUnmarshal(t *testing.T) {
	var addr Address
	err := json.Unmarshal([]byte(`"0xd8da6bf26964af9d7eed9e03e53415d37aa96045"`), &addr)
	if err != nil {
		t.Fatalf("Unmarshal error: %v", err)
	}

	want := "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
	if addr.ChecksumHex() != want {
		t.Errorf("got %s, want %s", addr.ChecksumHex(), want)
	}
}

func TestCompare(t *testing.T) {
	a, _ := FromHex("0x0000000000000000000000000000000000000001")
	b, _ := FromHex("0x0000000000000000000000000000000000000002")

	if a.Compare(b) >= 0 {
		t.Error("a should be less than b")
	}
	if b.Compare(a) <= 0 {
		t.Error("b should be greater than a")
	}
	if a.Compare(a) != 0 {
		t.Error("a should equal a")
	}
}

func TestFromBytes(t *testing.T) {
	bytes := make([]byte, 20)
	bytes[19] = 1

	addr, err := FromBytes(bytes)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if addr[19] != 1 {
		t.Error("byte not copied correctly")
	}

	_, err = FromBytes(make([]byte, 19))
	if err == nil {
		t.Error("expected error for wrong length")
	}
}

func TestMustFromHex(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic for invalid input")
		}
	}()

	MustFromHex("invalid")
}
