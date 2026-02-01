package signature

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
)

// secp256k1 curve order N (local copy for tests)
var testSecp256k1N = [32]byte{
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
	0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
	0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
}

// secp256k1 N/2 (local copy for tests)
var testSecp256k1NHalf = [32]byte{
	0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
	0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa0,
}

func TestFromRSV(t *testing.T) {
	var r, s [32]byte
	for i := range r {
		r[i] = 0x11
		s[i] = 0x22
	}

	sig := FromRSV(r, s, 27)

	if sig.R != r {
		t.Error("R mismatch")
	}
	if sig.S != s {
		t.Error("S mismatch")
	}
	if sig.V != 27 {
		t.Errorf("V = %d, want 27", sig.V)
	}
}

func TestFromBytes(t *testing.T) {
	tests := []struct {
		name    string
		input   []byte
		wantV   byte
		wantErr bool
	}{
		{
			name:  "65 bytes with v=27",
			input: append(append(bytes.Repeat([]byte{0x11}, 32), bytes.Repeat([]byte{0x22}, 32)...), 27),
			wantV: 27,
		},
		{
			name:  "65 bytes with v=28",
			input: append(append(bytes.Repeat([]byte{0x11}, 32), bytes.Repeat([]byte{0x22}, 32)...), 28),
			wantV: 28,
		},
		{
			name:  "65 bytes with v=0",
			input: append(append(bytes.Repeat([]byte{0x11}, 32), bytes.Repeat([]byte{0x22}, 32)...), 0),
			wantV: 0,
		},
		{
			name:  "65 bytes with v=1",
			input: append(append(bytes.Repeat([]byte{0x11}, 32), bytes.Repeat([]byte{0x22}, 32)...), 1),
			wantV: 1,
		},
		{
			name:  "65 bytes with EIP-155 v=37 (chainId=1, yParity=0)",
			input: append(append(bytes.Repeat([]byte{0x11}, 32), bytes.Repeat([]byte{0x22}, 32)...), 37),
			wantV: 37,
		},
		{
			name:  "65 bytes with EIP-155 v=38 (chainId=1, yParity=1)",
			input: append(append(bytes.Repeat([]byte{0x11}, 32), bytes.Repeat([]byte{0x22}, 32)...), 38),
			wantV: 38,
		},
		{
			name:    "64 bytes (missing v)",
			input:   bytes.Repeat([]byte{0x11}, 64),
			wantErr: true,
		},
		{
			name:    "63 bytes (too short)",
			input:   bytes.Repeat([]byte{0x11}, 63),
			wantErr: true,
		},
		{
			name:    "66 bytes (too long)",
			input:   bytes.Repeat([]byte{0x11}, 66),
			wantErr: true,
		},
		{
			name:    "empty",
			input:   []byte{},
			wantErr: true,
		},
		{
			name:    "nil",
			input:   nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sig, err := FromBytes(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if sig.V != tt.wantV {
				t.Errorf("V = %d, want %d", sig.V, tt.wantV)
			}
		})
	}
}

func TestFromHex(t *testing.T) {
	r := strings.Repeat("11", 32)
	s := strings.Repeat("22", 32)

	tests := []struct {
		name    string
		input   string
		wantV   byte
		wantErr bool
	}{
		{
			name:  "with 0x prefix and v=27",
			input: "0x" + r + s + "1b",
			wantV: 27,
		},
		{
			name:  "without 0x prefix and v=28",
			input: r + s + "1c",
			wantV: 28,
		},
		{
			name:  "uppercase hex",
			input: "0x" + strings.ToUpper(r+s) + "1B",
			wantV: 27,
		},
		{
			name:  "mixed case",
			input: "0x" + strings.ToUpper(r) + s + "1b",
			wantV: 27,
		},
		{
			name:  "v=0 (raw recovery ID)",
			input: "0x" + r + s + "00",
			wantV: 0,
		},
		{
			name:  "v=1 (raw recovery ID)",
			input: "0x" + r + s + "01",
			wantV: 1,
		},
		{
			name:    "invalid hex chars",
			input:   "0x" + strings.Repeat("zz", 32) + s + "1b",
			wantErr: true,
		},
		{
			name:    "too short",
			input:   "0x" + r + s,
			wantErr: true,
		},
		{
			name:    "too long",
			input:   "0x" + r + s + "1b00",
			wantErr: true,
		},
		{
			name:    "odd length",
			input:   "0x" + r + s + "1",
			wantErr: true,
		},
		{
			name:    "empty",
			input:   "",
			wantErr: true,
		},
		{
			name:    "just prefix",
			input:   "0x",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sig, err := FromHex(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if sig.V != tt.wantV {
				t.Errorf("V = %d, want %d", sig.V, tt.wantV)
			}
		})
	}
}

func TestMustFromHex(t *testing.T) {
	r := strings.Repeat("aa", 32)
	s := strings.Repeat("bb", 32)
	hex := "0x" + r + s + "1b"

	sig := MustFromHex(hex)
	if sig.V != 27 {
		t.Errorf("V = %d, want 27", sig.V)
	}
}

func TestMustFromHexPanics(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic")
		}
	}()
	MustFromHex("invalid")
}

func TestBytes(t *testing.T) {
	var r, s [32]byte
	for i := range r {
		r[i] = byte(i)
		s[i] = byte(i + 32)
	}

	sig := FromRSV(r, s, 27)
	b := sig.Bytes()

	if len(b) != 65 {
		t.Errorf("len = %d, want 65", len(b))
	}
	if !bytes.Equal(b[:32], r[:]) {
		t.Error("R bytes mismatch")
	}
	if !bytes.Equal(b[32:64], s[:]) {
		t.Error("S bytes mismatch")
	}
	if b[64] != 27 {
		t.Errorf("V = %d, want 27", b[64])
	}
}

func TestHex(t *testing.T) {
	var r, s [32]byte
	for i := range r {
		r[i] = 0xaa
		s[i] = 0xbb
	}

	sig := FromRSV(r, s, 27)
	hex := sig.Hex()

	if !strings.HasPrefix(hex, "0x") {
		t.Error("missing 0x prefix")
	}
	if len(hex) != 132 { // 0x + 64 + 64 + 2
		t.Errorf("len = %d, want 132", len(hex))
	}
	if !strings.Contains(hex, strings.Repeat("aa", 32)) {
		t.Error("R not in hex")
	}
	if !strings.Contains(hex, strings.Repeat("bb", 32)) {
		t.Error("S not in hex")
	}
	if !strings.HasSuffix(hex, "1b") {
		t.Errorf("V suffix = %s, want 1b", hex[len(hex)-2:])
	}
}

func TestIsLowS(t *testing.T) {
	var r [32]byte
	r[31] = 1

	tests := []struct {
		name   string
		s      [32]byte
		wantLo bool
	}{
		{
			name:   "s = 1 (very low)",
			s:      [32]byte{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1},
			wantLo: true,
		},
		{
			name:   "s = N/2 (boundary, canonical)",
			s:      testSecp256k1NHalf,
			wantLo: true,
		},
		{
			name: "s = N/2 + 1 (non-canonical)",
			s: func() [32]byte {
				s := testSecp256k1NHalf
				s[31]++ // Add 1
				return s
			}(),
			wantLo: false,
		},
		{
			name:   "s = 0xff...ff (very high)",
			s:      [32]byte{0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff},
			wantLo: false,
		},
		{
			name:   "s = 0 (edge case)",
			s:      [32]byte{},
			wantLo: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			sig := FromRSV(r, tt.s, 27)
			if got := sig.IsLowS(); got != tt.wantLo {
				t.Errorf("IsLowS() = %v, want %v", got, tt.wantLo)
			}
		})
	}
}

func TestToLowS(t *testing.T) {
	var r [32]byte
	r[31] = 1

	t.Run("already canonical", func(t *testing.T) {
		s := [32]byte{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1}
		sig := FromRSV(r, s, 27)
		canonical := sig.ToLowS()

		if canonical.S != s {
			t.Error("S should not change")
		}
		if canonical.V != 27 {
			t.Errorf("V = %d, want 27", canonical.V)
		}
	})

	t.Run("non-canonical v=27 flips to v=28", func(t *testing.T) {
		// s just above N/2
		s := testSecp256k1NHalf
		s[31]++ // N/2 + 1

		sig := FromRSV(r, s, 27)
		if sig.IsLowS() {
			t.Fatal("expected non-canonical")
		}

		canonical := sig.ToLowS()
		if !canonical.IsLowS() {
			t.Error("expected canonical after ToLowS")
		}
		if canonical.V != 28 {
			t.Errorf("V = %d, want 28 (flipped)", canonical.V)
		}
	})

	t.Run("non-canonical v=28 flips to v=27", func(t *testing.T) {
		s := testSecp256k1NHalf
		s[31]++

		sig := FromRSV(r, s, 28)
		canonical := sig.ToLowS()

		if canonical.V != 27 {
			t.Errorf("V = %d, want 27 (flipped)", canonical.V)
		}
	})

	t.Run("EIP-155 v=37 flips to v=38", func(t *testing.T) {
		s := testSecp256k1NHalf
		s[31]++

		sig := FromRSV(r, s, 37) // chainId=1, yParity=0
		canonical := sig.ToLowS()

		if canonical.V != 38 {
			t.Errorf("V = %d, want 38 (flipped)", canonical.V)
		}
	})

	t.Run("EIP-155 v=38 flips to v=37", func(t *testing.T) {
		s := testSecp256k1NHalf
		s[31]++

		sig := FromRSV(r, s, 38) // chainId=1, yParity=1
		canonical := sig.ToLowS()

		if canonical.V != 37 {
			t.Errorf("V = %d, want 37 (flipped)", canonical.V)
		}
	})

	t.Run("raw recovery ID v=0 flips to v=1", func(t *testing.T) {
		s := testSecp256k1NHalf
		s[31]++

		sig := FromRSV(r, s, 0)
		canonical := sig.ToLowS()

		if canonical.V != 1 {
			t.Errorf("V = %d, want 1 (flipped)", canonical.V)
		}
	})

	t.Run("raw recovery ID v=1 flips to v=0", func(t *testing.T) {
		s := testSecp256k1NHalf
		s[31]++

		sig := FromRSV(r, s, 1)
		canonical := sig.ToLowS()

		if canonical.V != 0 {
			t.Errorf("V = %d, want 0 (flipped)", canonical.V)
		}
	})

	t.Run("s = N - 1 normalizes to s = 1", func(t *testing.T) {
		// s = N - 1
		s := testSecp256k1N
		s[31]-- // N - 1

		sig := FromRSV(r, s, 27)
		canonical := sig.ToLowS()

		// s_new = N - s = N - (N-1) = 1
		expected := [32]byte{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1}
		if canonical.S != expected {
			t.Errorf("S mismatch: got %x, want %x", canonical.S, expected)
		}
	})
}

func TestRecoveryID(t *testing.T) {
	var r, s [32]byte

	tests := []struct {
		v       byte
		wantRec byte
	}{
		{0, 0},
		{1, 1},
		{27, 0},
		{28, 1},
		{37, 0},  // chainId=1, yParity=0
		{38, 1},  // chainId=1, yParity=1
		{253, 0}, // Large chainId, yParity=0: (253-35)%2=0
		{254, 1}, // Large chainId, yParity=1: (254-35)%2=1
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			sig := FromRSV(r, s, tt.v)
			if got := sig.RecoveryID(); got != tt.wantRec {
				t.Errorf("RecoveryID() for v=%d = %d, want %d", tt.v, got, tt.wantRec)
			}
		})
	}
}

func TestYParity(t *testing.T) {
	var r, s [32]byte

	sig27 := FromRSV(r, s, 27)
	sig28 := FromRSV(r, s, 28)

	if sig27.YParity() != 0 {
		t.Errorf("YParity for v=27 = %d, want 0", sig27.YParity())
	}
	if sig28.YParity() != 1 {
		t.Errorf("YParity for v=28 = %d, want 1", sig28.YParity())
	}
}

func TestString(t *testing.T) {
	var r, s [32]byte
	for i := range r {
		r[i] = 0xaa
		s[i] = 0xbb
	}

	sig := FromRSV(r, s, 27)
	str := sig.String()

	if str != sig.Hex() {
		t.Errorf("String() = %s, want %s", str, sig.Hex())
	}
}

func TestEqual(t *testing.T) {
	var r1, s1 [32]byte
	for i := range r1 {
		r1[i] = 0x11
		s1[i] = 0x22
	}

	r2 := r1
	s2 := s1
	r2[0] = 0xff
	s2[0] = 0xff

	sig1 := FromRSV(r1, s1, 27)
	sig2 := FromRSV(r1, s1, 27)
	sig3 := FromRSV(r2, s1, 27)
	sig4 := FromRSV(r1, s1, 28)
	sig5 := FromRSV(r1, s2, 27)

	if !sig1.Equal(sig2) {
		t.Error("equal signatures should match")
	}
	if sig1.Equal(sig3) {
		t.Error("different R should not match")
	}
	if sig1.Equal(sig4) {
		t.Error("different V should not match")
	}
	if sig1.Equal(sig5) {
		t.Error("different S should not match")
	}
}

func TestMarshalText(t *testing.T) {
	var r, s [32]byte
	for i := range r {
		r[i] = 0xaa
		s[i] = 0xbb
	}

	sig := FromRSV(r, s, 27)
	text, err := sig.MarshalText()
	if err != nil {
		t.Fatalf("MarshalText error: %v", err)
	}

	if string(text) != sig.Hex() {
		t.Errorf("MarshalText = %s, want %s", text, sig.Hex())
	}
}

func TestUnmarshalText(t *testing.T) {
	r := strings.Repeat("aa", 32)
	s := strings.Repeat("bb", 32)
	hex := "0x" + r + s + "1b"

	var sig Signature
	err := sig.UnmarshalText([]byte(hex))
	if err != nil {
		t.Fatalf("UnmarshalText error: %v", err)
	}

	if sig.V != 27 {
		t.Errorf("V = %d, want 27", sig.V)
	}
}

func TestMarshalJSON(t *testing.T) {
	var r, s [32]byte
	for i := range r {
		r[i] = 0xaa
		s[i] = 0xbb
	}

	sig := FromRSV(r, s, 27)
	data, err := json.Marshal(sig)
	if err != nil {
		t.Fatalf("MarshalJSON error: %v", err)
	}

	// Should be quoted hex string
	expected := `"` + sig.Hex() + `"`
	if string(data) != expected {
		t.Errorf("MarshalJSON = %s, want %s", data, expected)
	}
}

func TestUnmarshalJSON(t *testing.T) {
	r := strings.Repeat("aa", 32)
	s := strings.Repeat("bb", 32)
	hex := "0x" + r + s + "1b"

	var sig Signature
	err := json.Unmarshal([]byte(`"`+hex+`"`), &sig)
	if err != nil {
		t.Fatalf("UnmarshalJSON error: %v", err)
	}

	if sig.V != 27 {
		t.Errorf("V = %d, want 27", sig.V)
	}
}

func TestUnmarshalJSONInvalid(t *testing.T) {
	tests := []struct {
		name  string
		input string
	}{
		{"not quoted", `0xaabb`},
		{"missing end quote", `"0xaabb`},
		{"missing start quote", `0xaabb"`},
		{"empty", ``},
		{"number", `123`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var sig Signature
			err := json.Unmarshal([]byte(tt.input), &sig)
			if err == nil {
				t.Error("expected error")
			}
		})
	}
}

func TestRoundtrip(t *testing.T) {
	var r, s [32]byte
	for i := range r {
		r[i] = byte(i * 3)
		s[i] = byte(i * 5)
	}

	original := FromRSV(r, s, 28)

	// Bytes roundtrip
	restored, err := FromBytes(original.Bytes())
	if err != nil {
		t.Fatalf("FromBytes error: %v", err)
	}
	if !original.Equal(restored) {
		t.Error("Bytes roundtrip failed")
	}

	// Hex roundtrip
	restored, err = FromHex(original.Hex())
	if err != nil {
		t.Fatalf("FromHex error: %v", err)
	}
	if !original.Equal(restored) {
		t.Error("Hex roundtrip failed")
	}

	// JSON roundtrip
	data, _ := json.Marshal(original)
	var jsonRestored Signature
	err = json.Unmarshal(data, &jsonRestored)
	if err != nil {
		t.Fatalf("JSON unmarshal error: %v", err)
	}
	if !original.Equal(jsonRestored) {
		t.Error("JSON roundtrip failed")
	}
}

func TestZeroSignature(t *testing.T) {
	var zero Signature

	if zero.V != 0 {
		t.Errorf("zero V = %d, want 0", zero.V)
	}

	// Zero should still serialize correctly
	hex := zero.Hex()
	if !strings.HasPrefix(hex, "0x") {
		t.Error("zero Hex should have 0x prefix")
	}
	if len(hex) != 132 {
		t.Errorf("zero Hex len = %d, want 132", len(hex))
	}
}

func TestLargeChainIDV(t *testing.T) {
	var r, s [32]byte

	// Polygon mainnet: chainId = 137
	// v = 137 * 2 + 35 + 0 = 309
	// v = 137 * 2 + 35 + 1 = 310
	sig309 := FromRSV(r, s, 255) // Max single byte

	if sig309.V != 255 {
		t.Errorf("V = %d, want 255", sig309.V)
	}

	// Recovery ID for v >= 35: (v - 35) % 2
	// For v = 255: (255 - 35) % 2 = 220 % 2 = 0
	if sig309.RecoveryID() != 0 {
		t.Errorf("RecoveryID for v=255 = %d, want 0", sig309.RecoveryID())
	}
}
