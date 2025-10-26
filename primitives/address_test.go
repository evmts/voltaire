package primitives

import (
	"math/big"
	"testing"
)

func TestAddressFromHex(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{
			name:    "valid lowercase",
			input:   "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			wantErr: false,
		},
		{
			name:    "valid checksum",
			input:   "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
			wantErr: false,
		},
		{
			name:    "invalid length",
			input:   "0xa0cf79",
			wantErr: true,
		},
		{
			name:    "missing prefix",
			input:   "a0cf798816d4b9b9866b5330eea46a18382f251e",
			wantErr: true,
		},
		{
			name:    "invalid character",
			input:   "0xa0cf798816d4b9b9866b5330eea46a18382f251g",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addr, err := AddressFromHex(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("AddressFromHex(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
				return
			}
			if !tt.wantErr && addr.IsZero() && tt.input != "0x0000000000000000000000000000000000000000" {
				t.Errorf("AddressFromHex(%q) returned zero address unexpectedly", tt.input)
			}
		})
	}
}

func TestAddressToHex(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "lowercase address",
			input:    "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			expected: "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
		},
		{
			name:     "zero address",
			input:    "0x0000000000000000000000000000000000000000",
			expected: "0x0000000000000000000000000000000000000000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addr, err := AddressFromHex(tt.input)
			if err != nil {
				t.Fatalf("AddressFromHex(%q) failed: %v", tt.input, err)
			}
			result := addr.ToHex()
			if result != tt.expected {
				t.Errorf("ToHex() = %s, want %s", result, tt.expected)
			}
		})
	}
}

func TestAddressToChecksumHex(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "test case 1",
			input:    "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			expected: "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
		},
		{
			name:     "test case 2",
			input:    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
			expected: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
		},
		{
			name:     "test case 3",
			input:    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
			expected: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			addr, err := AddressFromHex(tt.input)
			if err != nil {
				t.Fatalf("AddressFromHex(%q) failed: %v", tt.input, err)
			}
			result := addr.ToChecksumHex()
			if result != tt.expected {
				t.Errorf("ToChecksumHex() = %s, want %s", result, tt.expected)
			}
		})
	}
}

func TestValidateChecksum(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "valid checksum",
			input:    "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
			expected: true,
		},
		{
			name:     "invalid checksum (all lowercase)",
			input:    "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			expected: false,
		},
		{
			name:     "invalid checksum (all uppercase)",
			input:    "0xA0CF798816D4B9B9866B5330EEA46A18382F251E",
			expected: false,
		},
		{
			name:     "valid checksum 2",
			input:    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateChecksum(tt.input)
			if result != tt.expected {
				t.Errorf("ValidateChecksum(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestAddressFromPublicKey(t *testing.T) {
	// Test vectors from Zig tests
	publicKeyX := new(big.Int)
	publicKeyX.SetString("8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75", 16)

	publicKeyY := new(big.Int)
	publicKeyY.SetString("3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5", 16)

	addr := AddressFromPublicKey(publicKeyX, publicKeyY)

	expected, err := AddressFromHex("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")
	if err != nil {
		t.Fatalf("Failed to create expected address: %v", err)
	}

	if !addr.Equals(expected) {
		t.Errorf("AddressFromPublicKey() = %s, want %s", addr.ToHex(), expected.ToHex())
	}

	// Verify checksum
	checksummed := addr.ToChecksumHex()
	expectedChecksum := "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
	if checksummed != expectedChecksum {
		t.Errorf("ToChecksumHex() = %s, want %s", checksummed, expectedChecksum)
	}
}

func TestAddressIsZero(t *testing.T) {
	zeroAddr := Address{}
	if !zeroAddr.IsZero() {
		t.Error("Zero address should return true for IsZero()")
	}

	nonZeroAddr, _ := AddressFromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
	if nonZeroAddr.IsZero() {
		t.Error("Non-zero address should return false for IsZero()")
	}
}

func TestAddressEquals(t *testing.T) {
	addr1, _ := AddressFromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
	addr2, _ := AddressFromHex("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e")
	addr3, _ := AddressFromHex("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")

	if !addr1.Equals(addr2) {
		t.Error("Same addresses should be equal regardless of case")
	}

	if addr1.Equals(addr3) {
		t.Error("Different addresses should not be equal")
	}
}

func TestIsValidAddress(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "valid lowercase",
			input:    "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			expected: true,
		},
		{
			name:     "valid checksum",
			input:    "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
			expected: true,
		},
		{
			name:     "too short",
			input:    "0xa0cf79",
			expected: false,
		},
		{
			name:     "no prefix",
			input:    "a0cf798816d4b9b9866b5330eea46a18382f251e",
			expected: false,
		},
		{
			name:     "invalid character",
			input:    "0xa0cf798816d4b9b9866b5330eea46a18382f251z",
			expected: false,
		},
		{
			name:     "too long",
			input:    "0xa0cf798816d4b9b9866b5330eea46a18382f251eff",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValidAddress(tt.input)
			if result != tt.expected {
				t.Errorf("IsValidAddress(%q) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestCalculateCreateAddress(t *testing.T) {
	tests := []struct {
		name     string
		deployer string
		nonce    uint64
		expected string
	}{
		{
			name:     "nonce 0",
			deployer: "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			nonce:    0,
			expected: "0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d",
		},
		{
			name:     "nonce 1",
			deployer: "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			nonce:    1,
			expected: "0x343c43a37d37dff08ae8c4a11544c718abb4fcf8",
		},
		{
			name:     "nonce 2",
			deployer: "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			nonce:    2,
			expected: "0xf778b86fa74e846c4f0a1fbd1335fe81c00a0c91",
		},
		{
			name:     "nonce 3",
			deployer: "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			nonce:    3,
			expected: "0xfffd933a0bc612844eaf0c6fe3e5b8e9b6c1d19c",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			deployer, err := AddressFromHex(tt.deployer)
			if err != nil {
				t.Fatalf("Failed to parse deployer address: %v", err)
			}

			result, err := CalculateCreateAddress(deployer, tt.nonce)
			if err != nil {
				t.Fatalf("CalculateCreateAddress() error = %v", err)
			}

			expected, err := AddressFromHex(tt.expected)
			if err != nil {
				t.Fatalf("Failed to parse expected address: %v", err)
			}

			if !result.Equals(expected) {
				t.Errorf("CalculateCreateAddress() = %s, want %s", result.ToHex(), expected.ToHex())
			}
		})
	}
}

func TestCalculateCreate2Address(t *testing.T) {
	// Test with zero values
	deployer := Address{}
	salt := [32]byte{}
	initCodeHash := [32]byte{}

	result := CalculateCreate2Address(deployer, salt, initCodeHash)
	expected, _ := AddressFromHex("0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38")

	if !result.Equals(expected) {
		t.Errorf("CalculateCreate2Address() = %s, want %s", result.ToHex(), expected.ToHex())
	}

	// Test deterministic: same inputs should give same output
	result2 := CalculateCreate2Address(deployer, salt, initCodeHash)
	if !result.Equals(result2) {
		t.Error("CalculateCreate2Address() should be deterministic")
	}
}

func TestAddressFromU256AndToU256(t *testing.T) {
	value := big.NewInt(0xdeadbeef)
	addr := AddressFromU256(value)

	// Convert back to U256
	result := addr.ToU256()

	if result.Cmp(value) != 0 {
		t.Errorf("Round trip failed: got %s, want %s", result.String(), value.String())
	}
}

func TestAddressBytes(t *testing.T) {
	addr, _ := AddressFromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
	bytes := addr.Bytes()

	if len(bytes) != 20 {
		t.Errorf("Bytes() length = %d, want 20", len(bytes))
	}

	// Verify first few bytes
	expected := []byte{0xa0, 0xcf, 0x79, 0x88}
	for i := 0; i < 4; i++ {
		if bytes[i] != expected[i] {
			t.Errorf("Bytes()[%d] = 0x%02x, want 0x%02x", i, bytes[i], expected[i])
		}
	}
}

func TestAddressString(t *testing.T) {
	addr, _ := AddressFromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
	str := addr.String()

	// String() should return checksummed address
	expected := "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"
	if str != expected {
		t.Errorf("String() = %s, want %s", str, expected)
	}
}
