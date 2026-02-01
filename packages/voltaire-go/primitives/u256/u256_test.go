package u256

import (
	"encoding/json"
	"math/big"
	"testing"
)

func TestFromHex(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"zero", "0x0", false},
		{"one", "0x1", false},
		{"max uint64", "0xffffffffffffffff", false},
		{"max u256", "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", false},
		{"invalid hex", "0xgg", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := FromHex(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestFromUint64(t *testing.T) {
	tests := []uint64{0, 1, 255, 256, 1<<32 - 1, 1<<64 - 1}

	for _, n := range tests {
		u := FromUint64(n)
		got := u.Uint64()
		if got != n {
			t.Errorf("FromUint64(%d).Uint64() = %d", n, got)
		}
	}
}

func TestFromBigInt(t *testing.T) {
	tests := []*big.Int{
		big.NewInt(0),
		big.NewInt(1),
		big.NewInt(1<<62 - 1),
	}

	for _, n := range tests {
		u, err := FromBigInt(n)
		if err != nil {
			t.Fatalf("FromBigInt(%s): %v", n, err)
		}
		got := u.BigInt()
		if got.Cmp(n) != 0 {
			t.Errorf("FromBigInt(%s).BigInt() = %s", n, got)
		}
	}

	// Test negative number
	_, err := FromBigInt(big.NewInt(-1))
	if err == nil {
		t.Error("expected error for negative number")
	}
}

func TestIsZero(t *testing.T) {
	if !Zero.IsZero() {
		t.Error("Zero should be zero")
	}
	if One.IsZero() {
		t.Error("One should not be zero")
	}
}

func TestCompare(t *testing.T) {
	a := FromUint64(1)
	b := FromUint64(2)

	if a.Compare(b) >= 0 {
		t.Error("1 should be less than 2")
	}
	if b.Compare(a) <= 0 {
		t.Error("2 should be greater than 1")
	}
	if a.Compare(a) != 0 {
		t.Error("a should equal a")
	}
}

func TestTrimmedBytes(t *testing.T) {
	u := FromUint64(256) // 0x100
	trimmed := u.TrimmedBytes()
	if len(trimmed) != 2 {
		t.Errorf("expected 2 bytes, got %d", len(trimmed))
	}
	if trimmed[0] != 1 || trimmed[1] != 0 {
		t.Errorf("expected [1, 0], got %v", trimmed)
	}

	// Zero case
	z := Zero
	zt := z.TrimmedBytes()
	if len(zt) != 1 || zt[0] != 0 {
		t.Errorf("expected [0], got %v", zt)
	}
}

func TestJSONRoundtrip(t *testing.T) {
	original := FromUint64(12345678)

	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Marshal error: %v", err)
	}

	var decoded U256
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal error: %v", err)
	}

	if !original.Equal(decoded) {
		t.Error("roundtrip failed")
	}
}
