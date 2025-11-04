package address

import (
	"math/big"
	"testing"
)

func TestFromHex(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:    "valid lowercase hex",
			input:   "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			wantErr: false,
		},
		{
			name:    "valid mixed case hex",
			input:   "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			wantErr: false,
		},
		{
			name:    "zero address",
			input:   "0x0000000000000000000000000000000000000000",
			wantErr: false,
		},
		{
			name:    "max address",
			input:   "0xffffffffffffffffffffffffffffffffffffffff",
			wantErr: false,
		},
		{
			name:    "missing 0x prefix",
			input:   "742d35cc6634c0532925a3b844bc9e7595f251e3",
			wantErr: true,
		},
		{
			name:    "invalid length too short",
			input:   "0x742d35cc",
			wantErr: true,
		},
		{
			name:    "invalid length too long",
			input:   "0x742d35cc6634c0532925a3b844bc9e7595f251e3ff",
			wantErr: true,
		},
		{
			name:    "invalid hex characters",
			input:   "0x742d35cc6634c0532925a3b844bc9e7595f251eZ",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addr, err := FromHex(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("FromHex() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && len(addr) != Size {
				t.Errorf("FromHex() length = %d, want %d", len(addr), Size)
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
			name:    "valid 20 bytes",
			input:   make([]byte, 20),
			wantErr: false,
		},
		{
			name:    "invalid length 19 bytes",
			input:   make([]byte, 19),
			wantErr: true,
		},
		{
			name:    "invalid length 21 bytes",
			input:   make([]byte, 21),
			wantErr: true,
		},
		{
			name:    "nil bytes",
			input:   nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addr, err := FromBytes(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("FromBytes() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && len(addr) != Size {
				t.Errorf("FromBytes() length = %d, want %d", len(addr), Size)
			}
		})
	}
}

func TestFromNumber(t *testing.T) {
	tests := []struct {
		name    string
		input   *big.Int
		wantErr bool
	}{
		{
			name:    "zero",
			input:   big.NewInt(0),
			wantErr: false,
		},
		{
			name:    "small positive number",
			input:   big.NewInt(12345),
			wantErr: false,
		},
		{
			name:    "negative number",
			input:   big.NewInt(-1),
			wantErr: true,
		},
		{
			name:    "large number",
			input:   new(big.Int).SetBytes([]byte{0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8, 0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf2, 0x51, 0xe3}),
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addr, err := FromNumber(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("FromNumber() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && len(addr) != Size {
				t.Errorf("FromNumber() length = %d, want %d", len(addr), Size)
			}
		})
	}
}

func TestFrom(t *testing.T) {
	tests := []struct {
		name    string
		input   interface{}
		wantErr bool
	}{
		{
			name:    "from string",
			input:   "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			wantErr: false,
		},
		{
			name:    "from int",
			input:   12345,
			wantErr: false,
		},
		{
			name:    "from int64",
			input:   int64(12345),
			wantErr: false,
		},
		{
			name:    "from uint64",
			input:   uint64(12345),
			wantErr: false,
		},
		{
			name:    "from big.Int",
			input:   big.NewInt(12345),
			wantErr: false,
		},
		{
			name:    "from bytes",
			input:   make([]byte, 20),
			wantErr: false,
		},
		{
			name:    "from Address",
			input:   Address{},
			wantErr: false,
		},
		{
			name:    "unsupported type",
			input:   true,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := From(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("From() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestToHex(t *testing.T) {
	addr, _ := FromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
	hex := addr.ToHex()

	if hex != "0x742d35cc6634c0532925a3b844bc9e7595f251e3" {
		t.Errorf("ToHex() = %s, want 0x742d35cc6634c0532925a3b844bc9e7595f251e3", hex)
	}
}

func TestToBytes(t *testing.T) {
	addr, _ := FromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
	b := addr.ToBytes()

	if len(b) != Size {
		t.Errorf("ToBytes() length = %d, want %d", len(b), Size)
	}
}

func TestEquals(t *testing.T) {
	addr1, _ := FromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
	addr2, _ := FromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
	addr3, _ := FromHex("0x0000000000000000000000000000000000000000")

	if !addr1.Equals(addr2) {
		t.Error("Equals() expected true for equal addresses")
	}

	if addr1.Equals(addr3) {
		t.Error("Equals() expected false for different addresses")
	}
}

func TestCompare(t *testing.T) {
	addr1, _ := FromHex("0x0000000000000000000000000000000000000001")
	addr2, _ := FromHex("0x0000000000000000000000000000000000000002")
	addr3, _ := FromHex("0x0000000000000000000000000000000000000001")

	if addr1.Compare(addr2) >= 0 {
		t.Error("Compare() expected negative for addr1 < addr2")
	}

	if addr2.Compare(addr1) <= 0 {
		t.Error("Compare() expected positive for addr2 > addr1")
	}

	if addr1.Compare(addr3) != 0 {
		t.Error("Compare() expected 0 for equal addresses")
	}
}

func TestLessThan(t *testing.T) {
	addr1, _ := FromHex("0x0000000000000000000000000000000000000001")
	addr2, _ := FromHex("0x0000000000000000000000000000000000000002")

	if !addr1.LessThan(addr2) {
		t.Error("LessThan() expected true")
	}

	if addr2.LessThan(addr1) {
		t.Error("LessThan() expected false")
	}
}

func TestGreaterThan(t *testing.T) {
	addr1, _ := FromHex("0x0000000000000000000000000000000000000001")
	addr2, _ := FromHex("0x0000000000000000000000000000000000000002")

	if addr1.GreaterThan(addr2) {
		t.Error("GreaterThan() expected false")
	}

	if !addr2.GreaterThan(addr1) {
		t.Error("GreaterThan() expected true")
	}
}

func TestIsZero(t *testing.T) {
	zeroAddr := Zero()
	nonZeroAddr, _ := FromHex("0x0000000000000000000000000000000000000001")

	if !zeroAddr.IsZero() {
		t.Error("IsZero() expected true for zero address")
	}

	if nonZeroAddr.IsZero() {
		t.Error("IsZero() expected false for non-zero address")
	}
}

func TestIsValid(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{
			name:  "valid with 0x",
			input: "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			want:  true,
		},
		{
			name:  "valid without 0x",
			input: "742d35cc6634c0532925a3b844bc9e7595f251e3",
			want:  true,
		},
		{
			name:  "invalid length",
			input: "0x742d35cc",
			want:  false,
		},
		{
			name:  "invalid characters",
			input: "0x742d35cc6634c0532925a3b844bc9e7595f251eZ",
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsValid(tt.input); got != tt.want {
				t.Errorf("IsValid() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestString(t *testing.T) {
	addr, _ := FromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3")
	s := addr.String()

	if s != "0x742d35cc6634c0532925a3b844bc9e7595f251e3" {
		t.Errorf("String() = %s, want 0x742d35cc6634c0532925a3b844bc9e7595f251e3", s)
	}
}

func TestZero(t *testing.T) {
	addr := Zero()

	if !addr.IsZero() {
		t.Error("Zero() should return zero address")
	}

	if addr.ToHex() != "0x0000000000000000000000000000000000000000" {
		t.Errorf("Zero() hex = %s, want 0x0000000000000000000000000000000000000000", addr.ToHex())
	}
}
