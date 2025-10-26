package primitives

import (
	"math/big"
	"testing"
)

func TestParseEther(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected *big.Int
		wantErr  bool
	}{
		{
			name:     "zero",
			input:    "0",
			expected: big.NewInt(0),
			wantErr:  false,
		},
		{
			name:     "one ether",
			input:    "1",
			expected: new(big.Int).Set(Ether),
			wantErr:  false,
		},
		{
			name:     "1.5 ether",
			input:    "1.5",
			expected: new(big.Int).Add(Ether, new(big.Int).Div(Ether, big.NewInt(2))),
			wantErr:  false,
		},
		{
			name:     "0.001 ether (1 finney)",
			input:    "0.001",
			expected: new(big.Int).Set(Finney),
			wantErr:  false,
		},
		{
			name:     "leading decimal",
			input:    ".1",
			expected: new(big.Int).Div(Ether, big.NewInt(10)),
			wantErr:  false,
		},
		{
			name:     "with whitespace",
			input:    "  1.5  ",
			expected: new(big.Int).Add(Ether, new(big.Int).Div(Ether, big.NewInt(2))),
			wantErr:  false,
		},
		{
			name:     "empty string",
			input:    "",
			expected: nil,
			wantErr:  true,
		},
		{
			name:     "invalid format",
			input:    "abc",
			expected: nil,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseEther(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseEther(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && result.Cmp(tt.expected) != 0 {
				t.Errorf("ParseEther(%q) = %s, want %s", tt.input, result.String(), tt.expected.String())
			}
		})
	}
}

func TestParseGwei(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected *big.Int
		wantErr  bool
	}{
		{
			name:     "one gwei",
			input:    "1",
			expected: new(big.Int).Set(Gwei),
			wantErr:  false,
		},
		{
			name:     "20 gwei",
			input:    "20",
			expected: new(big.Int).Mul(big.NewInt(20), Gwei),
			wantErr:  false,
		},
		{
			name:     "0.5 gwei",
			input:    "0.5",
			expected: new(big.Int).Div(Gwei, big.NewInt(2)),
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseGwei(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseGwei(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && result.Cmp(tt.expected) != 0 {
				t.Errorf("ParseGwei(%q) = %s, want %s", tt.input, result.String(), tt.expected.String())
			}
		})
	}
}

func TestParseUnits(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		unit     Unit
		expected *big.Int
		wantErr  bool
	}{
		{
			name:     "1 wei",
			input:    "1",
			unit:     UnitWei,
			expected: big.NewInt(1),
			wantErr:  false,
		},
		{
			name:     "1 kwei",
			input:    "1",
			unit:     UnitKwei,
			expected: new(big.Int).Set(Kwei),
			wantErr:  false,
		},
		{
			name:     "1 gwei",
			input:    "1",
			unit:     UnitGwei,
			expected: new(big.Int).Set(Gwei),
			wantErr:  false,
		},
		{
			name:     "1 ether",
			input:    "1",
			unit:     UnitEther,
			expected: new(big.Int).Set(Ether),
			wantErr:  false,
		},
		{
			name:     "0.5 ether",
			input:    "0.5",
			unit:     UnitEther,
			expected: new(big.Int).Div(Ether, big.NewInt(2)),
			wantErr:  false,
		},
		{
			name:     "decimal only",
			input:    ".1",
			unit:     UnitEther,
			expected: new(big.Int).Div(Ether, big.NewInt(10)),
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ParseUnits(tt.input, tt.unit)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseUnits(%q, %v) error = %v, wantErr %v", tt.input, tt.unit, err, tt.wantErr)
				return
			}
			if !tt.wantErr && result.Cmp(tt.expected) != 0 {
				t.Errorf("ParseUnits(%q, %v) = %s, want %s", tt.input, tt.unit, result.String(), tt.expected.String())
			}
		})
	}
}

func TestFormatEther(t *testing.T) {
	tests := []struct {
		name     string
		input    *big.Int
		expected string
	}{
		{
			name:     "zero",
			input:    big.NewInt(0),
			expected: "0",
		},
		{
			name:     "1 ether",
			input:    new(big.Int).Set(Ether),
			expected: "1",
		},
		{
			name:     "1.5 ether",
			input:    new(big.Int).Add(Ether, new(big.Int).Div(Ether, big.NewInt(2))),
			expected: "1.5",
		},
		{
			name:     "0.001 ether",
			input:    new(big.Int).Set(Finney),
			expected: "0.001",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FormatEther(tt.input)
			if result != tt.expected {
				t.Errorf("FormatEther(%s) = %s, want %s", tt.input.String(), result, tt.expected)
			}
		})
	}
}

func TestFormatGwei(t *testing.T) {
	tests := []struct {
		name     string
		input    *big.Int
		expected string
	}{
		{
			name:     "1 gwei",
			input:    new(big.Int).Set(Gwei),
			expected: "1",
		},
		{
			name:     "20 gwei",
			input:    new(big.Int).Mul(big.NewInt(20), Gwei),
			expected: "20",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FormatGwei(tt.input)
			if result != tt.expected {
				t.Errorf("FormatGwei(%s) = %s, want %s", tt.input.String(), result, tt.expected)
			}
		})
	}
}

func TestConvertUnits(t *testing.T) {
	tests := []struct {
		name     string
		value    *big.Int
		fromUnit Unit
		toUnit   Unit
		expected *big.Int
	}{
		{
			name:     "1 ether to gwei",
			value:    big.NewInt(1),
			fromUnit: UnitEther,
			toUnit:   UnitGwei,
			expected: big.NewInt(1_000_000_000),
		},
		{
			name:     "1000 gwei to ether",
			value:    big.NewInt(1_000_000_000),
			fromUnit: UnitGwei,
			toUnit:   UnitEther,
			expected: big.NewInt(1),
		},
		{
			name:     "1 wei to wei",
			value:    big.NewInt(1),
			fromUnit: UnitWei,
			toUnit:   UnitWei,
			expected: big.NewInt(1),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ConvertUnits(tt.value, tt.fromUnit, tt.toUnit)
			if result.Cmp(tt.expected) != 0 {
				t.Errorf("ConvertUnits(%s, %v, %v) = %s, want %s",
					tt.value.String(), tt.fromUnit, tt.toUnit, result.String(), tt.expected.String())
			}
		})
	}
}

func TestCalculateGasCost(t *testing.T) {
	gasUsed := uint64(21000)
	gasPriceGwei := big.NewInt(20)

	expected := new(big.Int).Mul(big.NewInt(21000), new(big.Int).Mul(big.NewInt(20), Gwei))
	result := CalculateGasCost(gasUsed, gasPriceGwei)

	if result.Cmp(expected) != 0 {
		t.Errorf("CalculateGasCost(%d, %s) = %s, want %s",
			gasUsed, gasPriceGwei.String(), result.String(), expected.String())
	}
}

func TestSafeAdd(t *testing.T) {
	tests := []struct {
		name    string
		a       *big.Int
		b       *big.Int
		wantErr bool
	}{
		{
			name:    "normal addition",
			a:       big.NewInt(2),
			b:       big.NewInt(3),
			wantErr: false,
		},
		{
			name:    "zero addition",
			a:       big.NewInt(0),
			b:       big.NewInt(5),
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := SafeAdd(tt.a, tt.b)
			if (err != nil) != tt.wantErr {
				t.Errorf("SafeAdd() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				expected := new(big.Int).Add(tt.a, tt.b)
				if result.Cmp(expected) != 0 {
					t.Errorf("SafeAdd(%s, %s) = %s, want %s",
						tt.a.String(), tt.b.String(), result.String(), expected.String())
				}
			}
		})
	}
}

func TestSafeSub(t *testing.T) {
	tests := []struct {
		name    string
		a       *big.Int
		b       *big.Int
		wantErr bool
	}{
		{
			name:    "normal subtraction",
			a:       big.NewInt(5),
			b:       big.NewInt(3),
			wantErr: false,
		},
		{
			name:    "underflow",
			a:       big.NewInt(3),
			b:       big.NewInt(5),
			wantErr: true,
		},
		{
			name:    "zero result",
			a:       big.NewInt(5),
			b:       big.NewInt(5),
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := SafeSub(tt.a, tt.b)
			if (err != nil) != tt.wantErr {
				t.Errorf("SafeSub() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				expected := new(big.Int).Sub(tt.a, tt.b)
				if result.Cmp(expected) != 0 {
					t.Errorf("SafeSub(%s, %s) = %s, want %s",
						tt.a.String(), tt.b.String(), result.String(), expected.String())
				}
			}
		})
	}
}

func TestSafeMul(t *testing.T) {
	tests := []struct {
		name    string
		a       *big.Int
		b       *big.Int
		wantErr bool
	}{
		{
			name:    "normal multiplication",
			a:       big.NewInt(2),
			b:       big.NewInt(3),
			wantErr: false,
		},
		{
			name:    "multiply by zero",
			a:       big.NewInt(0),
			b:       big.NewInt(5),
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := SafeMul(tt.a, tt.b)
			if (err != nil) != tt.wantErr {
				t.Errorf("SafeMul() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				expected := new(big.Int).Mul(tt.a, tt.b)
				if result.Cmp(expected) != 0 {
					t.Errorf("SafeMul(%s, %s) = %s, want %s",
						tt.a.String(), tt.b.String(), result.String(), expected.String())
				}
			}
		})
	}
}

func TestSafeDiv(t *testing.T) {
	tests := []struct {
		name    string
		a       *big.Int
		b       *big.Int
		wantErr bool
	}{
		{
			name:    "normal division",
			a:       big.NewInt(6),
			b:       big.NewInt(3),
			wantErr: false,
		},
		{
			name:    "division by zero",
			a:       big.NewInt(5),
			b:       big.NewInt(0),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := SafeDiv(tt.a, tt.b)
			if (err != nil) != tt.wantErr {
				t.Errorf("SafeDiv() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				expected := new(big.Int).Div(tt.a, tt.b)
				if result.Cmp(expected) != 0 {
					t.Errorf("SafeDiv(%s, %s) = %s, want %s",
						tt.a.String(), tt.b.String(), result.String(), expected.String())
				}
			}
		})
	}
}

func TestMinMax(t *testing.T) {
	a := big.NewInt(5)
	b := big.NewInt(10)

	min := Min(a, b)
	if min.Cmp(a) != 0 {
		t.Errorf("Min(%s, %s) = %s, want %s", a.String(), b.String(), min.String(), a.String())
	}

	max := Max(a, b)
	if max.Cmp(b) != 0 {
		t.Errorf("Max(%s, %s) = %s, want %s", a.String(), b.String(), max.String(), b.String())
	}
}

func TestCalculatePercentage(t *testing.T) {
	value := big.NewInt(100)
	percentage := int64(50)

	result := CalculatePercentage(value, percentage)
	expected := big.NewInt(50)

	if result.Cmp(expected) != 0 {
		t.Errorf("CalculatePercentage(%s, %d) = %s, want %s",
			value.String(), percentage, result.String(), expected.String())
	}
}

func TestUnitFromString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected Unit
		wantErr  bool
	}{
		{"wei", "wei", UnitWei, false},
		{"kwei", "kwei", UnitKwei, false},
		{"gwei", "gwei", UnitGwei, false},
		{"ether", "ether", UnitEther, false},
		{"uppercase", "ETHER", UnitEther, false},
		{"invalid", "invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := UnitFromString(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("UnitFromString(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && result != tt.expected {
				t.Errorf("UnitFromString(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestUnitString(t *testing.T) {
	tests := []struct {
		unit     Unit
		expected string
	}{
		{UnitWei, "wei"},
		{UnitKwei, "kwei"},
		{UnitGwei, "gwei"},
		{UnitEther, "ether"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := tt.unit.String()
			if result != tt.expected {
				t.Errorf("Unit.String() = %s, want %s", result, tt.expected)
			}
		})
	}
}
