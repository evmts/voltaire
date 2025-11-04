package address

import (
	"testing"
)

func TestToShortHex(t *testing.T) {
	addr, _ := FromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3")

	tests := []struct {
		name      string
		prefixLen int
		suffixLen int
		want      string
	}{
		{
			name:      "default lengths",
			prefixLen: 6,
			suffixLen: 4,
			want:      "0x742d35...51e3",
		},
		{
			name:      "custom lengths",
			prefixLen: 8,
			suffixLen: 6,
			want:      "0x742d35cc...f251e3",
		},
		{
			name:      "full address",
			prefixLen: 40,
			suffixLen: 0,
			want:      "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		},
		{
			name:      "very short prefix",
			prefixLen: 2,
			suffixLen: 2,
			want:      "0x74...e3",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := addr.ToShortHex(tt.prefixLen, tt.suffixLen)
			if got != tt.want {
				t.Errorf("ToShortHex() = %s, want %s", got, tt.want)
			}
		})
	}
}

func TestFormat(t *testing.T) {
	addr, _ := FromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
	formatted := addr.Format()

	want := "0x742d35Cc6634c0532925a3b844bc9e7595F251E3"
	if formatted != want {
		t.Errorf("Format() = %s, want %s", formatted, want)
	}
}
