package primitives

import (
	"math/big"
	"testing"
)

func TestIsHex(t *testing.T) {
	tests := []struct {
		input    string
		expected bool
	}{
		{"0x0", true},
		{"0x00", true},
		{"0x1234", true},
		{"0xabcdef", true},
		{"0xABCDEF", true},
		{"0x0123456789abcdef", true},
		{"0xdeadbeef", true},
		{"", false},
		{"0", false},
		{"0x", false},
		{"00", false},
		{"0xg", false},
		{"0x0123456789abcdefg", false},
		{"0x ", false},
		{" 0x00", false},
		{"0x00 ", false},
		{"1234", false},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := IsHex(tt.input)
			if result != tt.expected {
				t.Errorf("IsHex(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestHexToBytes(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []byte
		wantErr  bool
	}{
		{
			name:     "empty hex",
			input:    "0x",
			expected: []byte{},
			wantErr:  false,
		},
		{
			name:     "single byte",
			input:    "0x61",
			expected: []byte{0x61},
			wantErr:  false,
		},
		{
			name:     "multiple bytes",
			input:    "0x616263",
			expected: []byte{0x61, 0x62, 0x63},
			wantErr:  false,
		},
		{
			name:     "hello world",
			input:    "0x48656c6c6f20576f726c6421",
			expected: []byte("Hello World!"),
			wantErr:  false,
		},
		{
			name:     "mixed case",
			input:    "0xDeAdBeEf",
			expected: []byte{0xde, 0xad, 0xbe, 0xef},
			wantErr:  false,
		},
		{
			name:     "missing prefix",
			input:    "deadbeef",
			expected: nil,
			wantErr:  true,
		},
		{
			name:     "odd length",
			input:    "0x1",
			expected: nil,
			wantErr:  true,
		},
		{
			name:     "odd length 2",
			input:    "0x123",
			expected: nil,
			wantErr:  true,
		},
		{
			name:     "invalid character",
			input:    "0xdeadbeeg",
			expected: nil,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := HexToBytes(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("HexToBytes(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if len(result) != len(tt.expected) {
					t.Errorf("HexToBytes(%q) length = %d, want %d", tt.input, len(result), len(tt.expected))
					return
				}
				for i := range result {
					if result[i] != tt.expected[i] {
						t.Errorf("HexToBytes(%q)[%d] = 0x%02x, want 0x%02x", tt.input, i, result[i], tt.expected[i])
					}
				}
			}
		})
	}
}

func TestBytesToHex(t *testing.T) {
	tests := []struct {
		name     string
		input    []byte
		expected string
	}{
		{
			name:     "empty bytes",
			input:    []byte{},
			expected: "0x",
		},
		{
			name:     "single byte",
			input:    []byte{0x61},
			expected: "0x61",
		},
		{
			name:     "multiple bytes",
			input:    []byte{0x61, 0x62, 0x63},
			expected: "0x616263",
		},
		{
			name:     "hello world",
			input:    []byte("Hello World!"),
			expected: "0x48656c6c6f20576f726c6421",
		},
		{
			name:     "deadbeef",
			input:    []byte{0xde, 0xad, 0xbe, 0xef},
			expected: "0xdeadbeef",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := BytesToHex(tt.input)
			if result != tt.expected {
				t.Errorf("BytesToHex(%v) = %s, want %s", tt.input, result, tt.expected)
			}
		})
	}
}

func TestHexToU256(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected *big.Int
		wantErr  bool
	}{
		{
			name:     "zero",
			input:    "0x0",
			expected: big.NewInt(0),
			wantErr:  false,
		},
		{
			name:     "small number",
			input:    "0x10f2c",
			expected: big.NewInt(69420),
			wantErr:  false,
		},
		{
			name:     "large number",
			input:    "0xdeadbeef",
			expected: big.NewInt(0xdeadbeef),
			wantErr:  false,
		},
		{
			name:     "empty hex",
			input:    "0x",
			expected: big.NewInt(0),
			wantErr:  false,
		},
		{
			name:     "missing prefix",
			input:    "deadbeef",
			expected: nil,
			wantErr:  true,
		},
		{
			name:     "invalid character",
			input:    "0xdeadbeeg",
			expected: nil,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := HexToU256(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("HexToU256(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && result.Cmp(tt.expected) != 0 {
				t.Errorf("HexToU256(%q) = %s, want %s", tt.input, result.String(), tt.expected.String())
			}
		})
	}
}

func TestU256ToHex(t *testing.T) {
	tests := []struct {
		name     string
		input    *big.Int
		expected string
	}{
		{
			name:     "zero",
			input:    big.NewInt(0),
			expected: "0x0",
		},
		{
			name:     "small number",
			input:    big.NewInt(69420),
			expected: "0x10f2c",
		},
		{
			name:     "large number",
			input:    big.NewInt(0xdeadbeef),
			expected: "0xdeadbeef",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := U256ToHex(tt.input)
			if result != tt.expected {
				t.Errorf("U256ToHex(%s) = %s, want %s", tt.input.String(), result, tt.expected)
			}
		})
	}
}

func TestHexToU64(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected uint64
		wantErr  bool
	}{
		{
			name:     "zero",
			input:    "0x0",
			expected: 0,
			wantErr:  false,
		},
		{
			name:     "small number",
			input:    "0x10f2c",
			expected: 69420,
			wantErr:  false,
		},
		{
			name:     "max uint64",
			input:    "0xffffffffffffffff",
			expected: 0xffffffffffffffff,
			wantErr:  false,
		},
		{
			name:     "overflow uint64",
			input:    "0x10000000000000000",
			expected: 0,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := HexToU64(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("HexToU64(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && result != tt.expected {
				t.Errorf("HexToU64(%q) = %d, want %d", tt.input, result, tt.expected)
			}
		})
	}
}

func TestU64ToHex(t *testing.T) {
	tests := []struct {
		name     string
		input    uint64
		expected string
	}{
		{
			name:     "zero",
			input:    0,
			expected: "0x0",
		},
		{
			name:     "small number",
			input:    69420,
			expected: "0x10f2c",
		},
		{
			name:     "max uint64",
			input:    0xffffffffffffffff,
			expected: "0xffffffffffffffff",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := U64ToHex(tt.input)
			if result != tt.expected {
				t.Errorf("U64ToHex(%d) = %s, want %s", tt.input, result, tt.expected)
			}
		})
	}
}

func TestPadLeft(t *testing.T) {
	tests := []struct {
		name     string
		input    []byte
		length   int
		expected []byte
	}{
		{
			name:     "pad short slice",
			input:    []byte{0x12, 0x34},
			length:   4,
			expected: []byte{0x00, 0x00, 0x12, 0x34},
		},
		{
			name:     "already correct length",
			input:    []byte{0x12, 0x34},
			length:   2,
			expected: []byte{0x12, 0x34},
		},
		{
			name:     "longer than target",
			input:    []byte{0x12, 0x34, 0x56, 0x78},
			length:   2,
			expected: []byte{0x12, 0x34, 0x56, 0x78},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := PadLeft(tt.input, tt.length)
			if len(result) != len(tt.expected) {
				t.Errorf("PadLeft(%v, %d) length = %d, want %d", tt.input, tt.length, len(result), len(tt.expected))
				return
			}
			for i := range result {
				if result[i] != tt.expected[i] {
					t.Errorf("PadLeft(%v, %d)[%d] = 0x%02x, want 0x%02x", tt.input, tt.length, i, result[i], tt.expected[i])
				}
			}
		})
	}
}

func TestTrimLeftZeros(t *testing.T) {
	tests := []struct {
		name     string
		input    []byte
		expected []byte
	}{
		{
			name:     "leading zeros",
			input:    []byte{0x00, 0x00, 0x12, 0x34},
			expected: []byte{0x12, 0x34},
		},
		{
			name:     "no leading zeros",
			input:    []byte{0x12, 0x34},
			expected: []byte{0x12, 0x34},
		},
		{
			name:     "all zeros",
			input:    []byte{0x00, 0x00, 0x00},
			expected: []byte{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := TrimLeftZeros(tt.input)
			if len(result) != len(tt.expected) {
				t.Errorf("TrimLeftZeros(%v) length = %d, want %d", tt.input, len(result), len(tt.expected))
				return
			}
			for i := range result {
				if result[i] != tt.expected[i] {
					t.Errorf("TrimLeftZeros(%v)[%d] = 0x%02x, want 0x%02x", tt.input, i, result[i], tt.expected[i])
				}
			}
		})
	}
}

func TestConcat(t *testing.T) {
	tests := []struct {
		name     string
		inputs   [][]byte
		expected []byte
	}{
		{
			name:     "two slices",
			inputs:   [][]byte{{0x12, 0x34}, {0xab, 0xcd}},
			expected: []byte{0x12, 0x34, 0xab, 0xcd},
		},
		{
			name:     "three slices",
			inputs:   [][]byte{{0x12}, {0x34}, {0x56}},
			expected: []byte{0x12, 0x34, 0x56},
		},
		{
			name:     "empty slices",
			inputs:   [][]byte{{}, {0x12, 0x34}, {}},
			expected: []byte{0x12, 0x34},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Concat(tt.inputs...)
			if len(result) != len(tt.expected) {
				t.Errorf("Concat(%v) length = %d, want %d", tt.inputs, len(result), len(tt.expected))
				return
			}
			for i := range result {
				if result[i] != tt.expected[i] {
					t.Errorf("Concat(%v)[%d] = 0x%02x, want 0x%02x", tt.inputs, i, result[i], tt.expected[i])
				}
			}
		})
	}
}
