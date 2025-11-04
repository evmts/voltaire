package address

import (
	"testing"
)

func TestToChecksummed(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "valid address",
			input: "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			want:  "0x742d35Cc6634c0532925a3b844bc9e7595F251E3",
		},
		{
			name:  "zero address",
			input: "0x0000000000000000000000000000000000000000",
			want:  "0x0000000000000000000000000000000000000000",
		},
		{
			name:  "max address",
			input: "0xffffffffffffffffffffffffffffffffffffffff",
			want:  "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addr, err := FromHex(tt.input)
			if err != nil {
				t.Fatalf("FromHex() error = %v", err)
			}

			got := addr.ToChecksummed()
			if got != tt.want {
				t.Errorf("ToChecksummed() = %s, want %s", got, tt.want)
			}
		})
	}
}

func TestIsValidChecksum(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{
			name:  "valid checksum",
			input: "0x742d35Cc6634c0532925a3b844bc9e7595F251E3",
			want:  true,
		},
		{
			name:  "invalid checksum",
			input: "0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			want:  false,
		},
		{
			name:  "lowercase valid format but invalid checksum",
			input: "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			want:  false,
		},
		{
			name:  "zero address checksum",
			input: "0x0000000000000000000000000000000000000000",
			want:  true,
		},
		{
			name:  "invalid format",
			input: "0x742d35cc",
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsValidChecksum(tt.input)
			if got != tt.want {
				t.Errorf("IsValidChecksum() = %v, want %v", got, tt.want)
			}
		})
	}
}
