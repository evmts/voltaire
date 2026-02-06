package privatekey

import (
	"bytes"
	"encoding/hex"
	"math/big"
	"testing"
)

// Test private key: Hardhat/Anvil account #0
const testPrivateKeyHex = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

// Expected address for test key
const expectedAddressHex = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

func TestGenerate(t *testing.T) {
	pk, err := Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	if !pk.IsValid() {
		t.Error("Generated key should be valid")
	}

	// Generate another and ensure they're different
	pk2, err := Generate()
	if err != nil {
		t.Fatalf("Generate() second call error: %v", err)
	}

	if pk == pk2 {
		t.Error("Two generated keys should be different")
	}
}

func TestFromHex(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:    "valid with 0x prefix",
			input:   testPrivateKeyHex,
			wantErr: false,
		},
		{
			name:    "valid without 0x prefix",
			input:   "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			wantErr: false,
		},
		{
			name:    "minimum valid key",
			input:   "0x0000000000000000000000000000000000000000000000000000000000000001",
			wantErr: false,
		},
		{
			name:    "too short",
			input:   "0x1234",
			wantErr: true,
		},
		{
			name:    "too long",
			input:   "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff8000",
			wantErr: true,
		},
		{
			name:    "invalid hex chars",
			input:   "0xGGGG74bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			wantErr: true,
		},
		{
			name:    "zero key",
			input:   "0x0000000000000000000000000000000000000000000000000000000000000000",
			wantErr: true,
		},
		{
			name:    "curve order (invalid)",
			input:   "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
			wantErr: true,
		},
		{
			name:    "above curve order (invalid)",
			input:   "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364142",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pk, err := FromHex(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !pk.IsValid() {
				t.Error("parsed key should be valid")
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
			name:    "valid 32 bytes",
			input:   make([]byte, 32),
			wantErr: true, // all zeros is invalid
		},
		{
			name:    "minimum valid",
			input:   append(make([]byte, 31), 0x01),
			wantErr: false,
		},
		{
			name:    "too short",
			input:   make([]byte, 16),
			wantErr: true,
		},
		{
			name:    "too long",
			input:   make([]byte, 64),
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := FromBytes(tt.input)
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

func TestMustFromHex(t *testing.T) {
	// Valid input should not panic
	pk := MustFromHex(testPrivateKeyHex)
	if !pk.IsValid() {
		t.Error("key should be valid")
	}

	// Invalid input should panic
	defer func() {
		if r := recover(); r == nil {
			t.Error("expected panic for invalid input")
		}
	}()

	MustFromHex("invalid")
}

func TestHex(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	got := pk.Hex()

	// Normalize to lowercase for comparison
	want := "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
	if got != want {
		t.Errorf("Hex() = %s, want %s", got, want)
	}
}

func TestBytes(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	b := pk.Bytes()

	if len(b) != 32 {
		t.Errorf("Bytes() length = %d, want 32", len(b))
	}

	// Check first byte
	if b[0] != 0xac {
		t.Errorf("Bytes()[0] = %x, want ac", b[0])
	}
}

func TestRoundTrip(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	hexStr := pk.Hex()

	pk2, err := FromHex(hexStr)
	if err != nil {
		t.Fatalf("FromHex() error: %v", err)
	}

	if pk != pk2 {
		t.Error("round-trip should produce identical key")
	}
}

func TestPublicKey(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	pubKey := pk.PublicKey()

	if len(pubKey) != 64 {
		t.Errorf("PublicKey() length = %d, want 64", len(pubKey))
	}

	// Public key should be non-zero
	allZero := true
	for _, b := range pubKey {
		if b != 0 {
			allZero = false
			break
		}
	}
	if allZero {
		t.Error("PublicKey() should not be all zeros")
	}
}

func TestPublicKeyDeterminism(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	pubKey1 := pk.PublicKey()
	pubKey2 := pk.PublicKey()

	if !bytes.Equal(pubKey1, pubKey2) {
		t.Error("PublicKey() should be deterministic")
	}
}

func TestPublicKeyDifferentKeys(t *testing.T) {
	pk1 := MustFromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
	pk2 := MustFromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81")

	pubKey1 := pk1.PublicKey()
	pubKey2 := pk2.PublicKey()

	if bytes.Equal(pubKey1, pubKey2) {
		t.Error("Different private keys should produce different public keys")
	}
}

func TestAddress(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	addr := pk.Address()

	// Check address length
	if len(addr) != 20 {
		t.Fatalf("Address() length = %d, want 20", len(addr))
	}

	// Check expected address
	expectedBytes, _ := hex.DecodeString("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
	if !bytes.Equal(addr[:], expectedBytes) {
		t.Errorf("Address() = %x, want %x", addr[:], expectedBytes)
	}
}

func TestAddressDeterminism(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	addr1 := pk.Address()
	addr2 := pk.Address()

	if addr1 != addr2 {
		t.Error("Address() should be deterministic")
	}
}

func TestIsValid(t *testing.T) {
	tests := []struct {
		name  string
		key   [32]byte
		valid bool
	}{
		{
			name:  "valid key",
			key:   MustFromHex(testPrivateKeyHex),
			valid: true,
		},
		{
			name:  "minimum valid (1)",
			key:   MustFromHex("0x0000000000000000000000000000000000000000000000000000000000000001"),
			valid: true,
		},
		{
			name:  "zero key",
			key:   [32]byte{},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pk := PrivateKey(tt.key)
			if got := pk.IsValid(); got != tt.valid {
				t.Errorf("IsValid() = %v, want %v", got, tt.valid)
			}
		})
	}
}

func TestSign(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	hash := [32]byte{0xab, 0xcd, 0xef}

	sig, err := pk.Sign(hash)
	if err != nil {
		t.Fatalf("Sign() error: %v", err)
	}

	// Signature should be 65 bytes (r + s + v)
	if len(sig) != 65 {
		t.Errorf("Sign() length = %d, want 65", len(sig))
	}

	// r and s should be non-zero
	r := sig[:32]
	s := sig[32:64]
	v := sig[64]

	allZeroR := true
	for _, b := range r {
		if b != 0 {
			allZeroR = false
			break
		}
	}
	if allZeroR {
		t.Error("r component should not be all zeros")
	}

	allZeroS := true
	for _, b := range s {
		if b != 0 {
			allZeroS = false
			break
		}
	}
	if allZeroS {
		t.Error("s component should not be all zeros")
	}

	// v should be 0 or 1 (recovery id)
	if v > 1 {
		t.Errorf("v = %d, want 0 or 1", v)
	}
}

func TestSignDeterminism(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	hash := [32]byte{0x12, 0x34, 0x56}

	sig1, err := pk.Sign(hash)
	if err != nil {
		t.Fatalf("Sign() error: %v", err)
	}

	sig2, err := pk.Sign(hash)
	if err != nil {
		t.Fatalf("Sign() second call error: %v", err)
	}

	if !bytes.Equal(sig1, sig2) {
		t.Error("Sign() should be deterministic (RFC 6979)")
	}
}

func TestSignDifferentHashes(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	hash1 := [32]byte{0x01}
	hash2 := [32]byte{0x02}

	sig1, _ := pk.Sign(hash1)
	sig2, _ := pk.Sign(hash2)

	if bytes.Equal(sig1, sig2) {
		t.Error("Different hashes should produce different signatures")
	}
}

func TestSignDifferentKeys(t *testing.T) {
	pk1 := MustFromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80")
	pk2 := MustFromHex("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81")
	hash := [32]byte{0xab}

	sig1, _ := pk1.Sign(hash)
	sig2, _ := pk2.Sign(hash)

	if bytes.Equal(sig1, sig2) {
		t.Error("Different private keys should produce different signatures")
	}
}

func TestSignMessage(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	msg := []byte("Hello, Ethereum!")

	sig, err := pk.SignMessage(msg)
	if err != nil {
		t.Fatalf("SignMessage() error: %v", err)
	}

	if len(sig) != 65 {
		t.Errorf("SignMessage() length = %d, want 65", len(sig))
	}
}

func TestSignMessageDeterminism(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)
	msg := []byte("Test message")

	sig1, _ := pk.SignMessage(msg)
	sig2, _ := pk.SignMessage(msg)

	if !bytes.Equal(sig1, sig2) {
		t.Error("SignMessage() should be deterministic")
	}
}

func TestSignEdgeCases(t *testing.T) {
	pk := MustFromHex(testPrivateKeyHex)

	// Zero hash
	zeroHash := [32]byte{}
	sig, err := pk.Sign(zeroHash)
	if err != nil {
		t.Fatalf("Sign(zero) error: %v", err)
	}
	if len(sig) != 65 {
		t.Error("Should sign zero hash")
	}

	// Max hash
	maxHash := [32]byte{}
	for i := range maxHash {
		maxHash[i] = 0xff
	}
	sig, err = pk.Sign(maxHash)
	if err != nil {
		t.Fatalf("Sign(max) error: %v", err)
	}
	if len(sig) != 65 {
		t.Error("Should sign max hash")
	}
}

func TestMinimumValidKey(t *testing.T) {
	// Private key = 1 should be valid
	pk := MustFromHex("0x0000000000000000000000000000000000000000000000000000000000000001")

	if !pk.IsValid() {
		t.Error("Key = 1 should be valid")
	}

	pubKey := pk.PublicKey()
	if len(pubKey) != 64 {
		t.Error("Should derive valid public key from minimum key")
	}

	addr := pk.Address()
	if len(addr) != 20 {
		t.Error("Should derive valid address from minimum key")
	}
}

func TestCurveOrderBoundary(t *testing.T) {
	// n - 1 should be valid (just below curve order)
	curveOrder := new(big.Int)
	curveOrder.SetString("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141", 16)

	nMinus1 := new(big.Int).Sub(curveOrder, big.NewInt(1))
	hexStr := "0x" + nMinus1.Text(16)

	pk, err := FromHex(hexStr)
	if err != nil {
		t.Fatalf("n-1 should be valid: %v", err)
	}

	if !pk.IsValid() {
		t.Error("n-1 should be valid")
	}
}

func TestSignatureVerifiable(t *testing.T) {
	// This test ensures the signature format is correct for Ethereum
	pk := MustFromHex(testPrivateKeyHex)
	hash := [32]byte{0xde, 0xad, 0xbe, 0xef}

	sig, err := pk.Sign(hash)
	if err != nil {
		t.Fatalf("Sign() error: %v", err)
	}

	// Extract components
	r := new(big.Int).SetBytes(sig[:32])
	s := new(big.Int).SetBytes(sig[32:64])

	// r and s must be positive
	if r.Sign() <= 0 {
		t.Error("r must be positive")
	}
	if s.Sign() <= 0 {
		t.Error("s must be positive")
	}

	// r and s must be less than curve order
	curveOrder := new(big.Int)
	curveOrder.SetString("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141", 16)

	if r.Cmp(curveOrder) >= 0 {
		t.Error("r must be less than curve order")
	}
	if s.Cmp(curveOrder) >= 0 {
		t.Error("s must be less than curve order")
	}
}
