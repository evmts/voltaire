package primitives

import (
	"bytes"
	"encoding/hex"
	"math/big"
	"testing"
)

// Test function selector computation
func TestComputeSelector(t *testing.T) {
	tests := []struct {
		name      string
		signature string
		expected  string
	}{
		{
			"transfer",
			"transfer(address,uint256)",
			"a9059cbb",
		},
		{
			"approve",
			"approve(address,uint256)",
			"095ea7b3",
		},
		{
			"balanceOf",
			"balanceOf(address)",
			"70a08231",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			selector := ComputeSelector(tt.signature)
			actual := hex.EncodeToString(selector[:])
			if actual != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, actual)
			}
		})
	}
}

// Test uint256 encoding
func TestEncodeUint256(t *testing.T) {
	params := []AbiParameter{{Type: TypeUint256}}
	value := big.NewInt(42)
	values := []AbiValue{value}

	encoded, err := EncodeAbiParameters(params, values)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	if len(encoded) != 32 {
		t.Errorf("Expected 32 bytes, got %d", len(encoded))
	}

	// Verify encoding
	expected := make([]byte, 32)
	expected[31] = 42

	if !bytes.Equal(encoded, expected) {
		t.Errorf("Encoding mismatch")
	}
}

// Test address encoding
func TestEncodeAddress(t *testing.T) {
	params := []AbiParameter{{Type: TypeAddress}}
	address := "0x1234567890123456789012345678901234567890"
	values := []AbiValue{address}

	encoded, err := EncodeAbiParameters(params, values)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	if len(encoded) != 32 {
		t.Errorf("Expected 32 bytes, got %d", len(encoded))
	}

	// Address should be right-padded in first 20 bytes after 12 zero bytes
	expectedPrefix := make([]byte, 12)
	if !bytes.Equal(encoded[:12], expectedPrefix) {
		t.Errorf("Expected zero padding at start")
	}
}

// Test bool encoding
func TestEncodeBool(t *testing.T) {
	tests := []struct {
		name     string
		value    bool
		expected byte
	}{
		{"true", true, 1},
		{"false", false, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			params := []AbiParameter{{Type: TypeBool}}
			values := []AbiValue{tt.value}

			encoded, err := EncodeAbiParameters(params, values)
			if err != nil {
				t.Fatalf("Encode failed: %v", err)
			}

			if len(encoded) != 32 {
				t.Errorf("Expected 32 bytes, got %d", len(encoded))
			}

			if encoded[31] != tt.expected {
				t.Errorf("Expected last byte to be %d, got %d", tt.expected, encoded[31])
			}
		})
	}
}

// Test string encoding (dynamic type)
func TestEncodeString(t *testing.T) {
	params := []AbiParameter{{Type: TypeString}}
	value := "hello"
	values := []AbiValue{value}

	encoded, err := EncodeAbiParameters(params, values)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// String encoding:
	// [0:32]   - offset to data (0x20 = 32)
	// [32:64]  - length (5)
	// [64:96]  - "hello" padded to 32 bytes

	// Check offset
	offset := new(big.Int).SetBytes(encoded[0:32])
	if offset.Int64() != 32 {
		t.Errorf("Expected offset 32, got %d", offset.Int64())
	}

	// Check length
	length := new(big.Int).SetBytes(encoded[32:64])
	if length.Int64() != 5 {
		t.Errorf("Expected length 5, got %d", length.Int64())
	}

	// Check data
	if string(encoded[64:69]) != "hello" {
		t.Errorf("Expected 'hello', got '%s'", encoded[64:69])
	}
}

// Test bytes encoding (dynamic type)
func TestEncodeBytes(t *testing.T) {
	params := []AbiParameter{{Type: TypeBytes}}
	value := []byte{0x12, 0x34, 0x56}
	values := []AbiValue{value}

	encoded, err := EncodeAbiParameters(params, values)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// Bytes encoding:
	// [0:32]   - offset to data (0x20 = 32)
	// [32:64]  - length (3)
	// [64:96]  - data padded to 32 bytes

	// Check offset
	offset := new(big.Int).SetBytes(encoded[0:32])
	if offset.Int64() != 32 {
		t.Errorf("Expected offset 32, got %d", offset.Int64())
	}

	// Check length
	length := new(big.Int).SetBytes(encoded[32:64])
	if length.Int64() != 3 {
		t.Errorf("Expected length 3, got %d", length.Int64())
	}

	// Check data
	if !bytes.Equal(encoded[64:67], value) {
		t.Errorf("Data mismatch")
	}
}

// Test bytes32 encoding (static type)
func TestEncodeBytes32(t *testing.T) {
	params := []AbiParameter{{Type: TypeBytes32}}
	value := make([]byte, 32)
	value[0] = 0xaa
	value[31] = 0xbb
	values := []AbiValue{value}

	encoded, err := EncodeAbiParameters(params, values)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	if len(encoded) != 32 {
		t.Errorf("Expected 32 bytes, got %d", len(encoded))
	}

	if !bytes.Equal(encoded, value) {
		t.Errorf("Encoding mismatch")
	}
}

// Test multiple parameters (mixed static and dynamic)
func TestEncodeMultipleParameters(t *testing.T) {
	params := []AbiParameter{
		{Type: TypeUint256},
		{Type: TypeString},
		{Type: TypeAddress},
	}

	values := []AbiValue{
		big.NewInt(123),
		"test",
		"0x1234567890123456789012345678901234567890",
	}

	encoded, err := EncodeAbiParameters(params, values)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// Expected layout:
	// [0:32]   - uint256 value (123)
	// [32:64]  - offset to string (96)
	// [64:96]  - address
	// [96:128] - string length (4)
	// [128:160] - string data "test" padded

	// Verify uint256
	value1 := new(big.Int).SetBytes(encoded[0:32])
	if value1.Int64() != 123 {
		t.Errorf("Expected uint256 value 123, got %d", value1.Int64())
	}

	// Verify string offset
	stringOffset := new(big.Int).SetBytes(encoded[32:64])
	if stringOffset.Int64() != 96 {
		t.Errorf("Expected string offset 96, got %d", stringOffset.Int64())
	}

	// Verify string length
	stringLength := new(big.Int).SetBytes(encoded[96:128])
	if stringLength.Int64() != 4 {
		t.Errorf("Expected string length 4, got %d", stringLength.Int64())
	}

	// Verify string data
	if string(encoded[128:132]) != "test" {
		t.Errorf("Expected 'test', got '%s'", encoded[128:132])
	}
}

// Test decoding uint256
func TestDecodeUint256(t *testing.T) {
	params := []AbiParameter{{Type: TypeUint256}}

	// Encode value 42
	encoded := make([]byte, 32)
	encoded[31] = 42

	decoded, err := DecodeAbiParameters(params, encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if len(decoded) != 1 {
		t.Fatalf("Expected 1 value, got %d", len(decoded))
	}

	value, ok := decoded[0].(*big.Int)
	if !ok {
		t.Fatalf("Expected *big.Int, got %T", decoded[0])
	}

	if value.Int64() != 42 {
		t.Errorf("Expected 42, got %d", value.Int64())
	}
}

// Test decoding address
func TestDecodeAddress(t *testing.T) {
	params := []AbiParameter{{Type: TypeAddress}}

	// Create encoded address
	encoded := make([]byte, 32)
	addrBytes := hexToBytes("1234567890123456789012345678901234567890")
	copy(encoded[12:], addrBytes)

	decoded, err := DecodeAbiParameters(params, encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if len(decoded) != 1 {
		t.Fatalf("Expected 1 value, got %d", len(decoded))
	}

	addr, ok := decoded[0].(string)
	if !ok {
		t.Fatalf("Expected string, got %T", decoded[0])
	}

	expected := "0x1234567890123456789012345678901234567890"
	if addr != expected {
		t.Errorf("Expected %s, got %s", expected, addr)
	}
}

// Test decoding string
func TestDecodeString(t *testing.T) {
	params := []AbiParameter{{Type: TypeString}}

	// Encode "hello"
	values := []AbiValue{"hello"}
	encoded, err := EncodeAbiParameters(params, values)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	decoded, err := DecodeAbiParameters(params, encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if len(decoded) != 1 {
		t.Fatalf("Expected 1 value, got %d", len(decoded))
	}

	str, ok := decoded[0].(string)
	if !ok {
		t.Fatalf("Expected string, got %T", decoded[0])
	}

	if str != "hello" {
		t.Errorf("Expected 'hello', got '%s'", str)
	}
}

// Test function signature creation
func TestCreateFunctionSignature(t *testing.T) {
	def := FunctionDefinition{
		Name: "transfer",
		Inputs: []AbiParameter{
			{Type: TypeAddress},
			{Type: TypeUint256},
		},
	}

	signature := CreateFunctionSignature(def)
	expected := "transfer(address,uint256)"

	if signature != expected {
		t.Errorf("Expected %s, got %s", expected, signature)
	}
}

// Test function data encoding
func TestEncodeFunctionData(t *testing.T) {
	def := FunctionDefinition{
		Name: "transfer",
		Inputs: []AbiParameter{
			{Type: TypeAddress},
			{Type: TypeUint256},
		},
	}

	args := []AbiValue{
		"0x1234567890123456789012345678901234567890",
		big.NewInt(100),
	}

	encoded, err := EncodeFunctionData(def, args)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// First 4 bytes should be selector
	if len(encoded) < 4 {
		t.Fatalf("Encoded data too short")
	}

	selector := ComputeSelector("transfer(address,uint256)")
	if !bytes.Equal(encoded[:4], selector[:]) {
		t.Errorf("Selector mismatch")
	}

	// Remaining bytes should be encoded parameters
	if len(encoded) != 4+64 { // 4 bytes selector + 2*32 bytes parameters
		t.Errorf("Expected 68 bytes total, got %d", len(encoded))
	}
}

// Test function data decoding
func TestDecodeFunctionData(t *testing.T) {
	def := FunctionDefinition{
		Name: "transfer",
		Inputs: []AbiParameter{
			{Type: TypeAddress},
			{Type: TypeUint256},
		},
	}

	args := []AbiValue{
		"0x1234567890123456789012345678901234567890",
		big.NewInt(100),
	}

	// Encode
	encoded, err := EncodeFunctionData(def, args)
	if err != nil {
		t.Fatalf("Encode failed: %v", err)
	}

	// Decode
	decoded, err := DecodeFunctionData(def, encoded)
	if err != nil {
		t.Fatalf("Decode failed: %v", err)
	}

	if len(decoded) != 2 {
		t.Fatalf("Expected 2 values, got %d", len(decoded))
	}

	// Check address
	addr, ok := decoded[0].(string)
	if !ok || addr != "0x1234567890123456789012345678901234567890" {
		t.Errorf("Address decode failed")
	}

	// Check amount
	amount, ok := decoded[1].(*big.Int)
	if !ok || amount.Int64() != 100 {
		t.Errorf("Amount decode failed")
	}
}

// Test packed encoding
func TestEncodePacked(t *testing.T) {
	params := []AbiParameter{
		{Type: TypeAddress},
		{Type: TypeUint256},
	}

	values := []AbiValue{
		"0x1234567890123456789012345678901234567890",
		big.NewInt(100),
	}

	packed, err := EncodePacked(params, values)
	if err != nil {
		t.Fatalf("EncodePacked failed: %v", err)
	}

	// Packed encoding: 20 bytes address + 32 bytes uint256 = 52 bytes
	if len(packed) != 52 {
		t.Errorf("Expected 52 bytes, got %d", len(packed))
	}

	// First 20 bytes should be address
	addrBytes := hexToBytes("1234567890123456789012345678901234567890")
	if !bytes.Equal(packed[:20], addrBytes) {
		t.Errorf("Address bytes mismatch")
	}

	// Next 32 bytes should be uint256
	valueBytes := make([]byte, 32)
	valueBytes[31] = 100
	if !bytes.Equal(packed[20:], valueBytes) {
		t.Errorf("Value bytes mismatch")
	}
}

// Test gas estimation
func TestEstimateGasForData(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		expected uint64
	}{
		{"all zeros", []byte{0x00, 0x00, 0x00}, 12},   // 3 * 4
		{"all non-zero", []byte{0x01, 0x02, 0x03}, 48}, // 3 * 16
		{"mixed", []byte{0x00, 0x01, 0x00}, 24},        // 4 + 16 + 4
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gas := EstimateGasForData(tt.data)
			if gas != tt.expected {
				t.Errorf("Expected %d gas, got %d", tt.expected, gas)
			}
		})
	}
}

// Test error cases
func TestAbiErrors(t *testing.T) {
	t.Run("parameter mismatch", func(t *testing.T) {
		params := []AbiParameter{{Type: TypeUint256}}
		values := []AbiValue{} // Empty values

		_, err := EncodeAbiParameters(params, values)
		if err != ErrParameterMismatch {
			t.Errorf("Expected ErrParameterMismatch, got %v", err)
		}
	})

	t.Run("invalid address", func(t *testing.T) {
		params := []AbiParameter{{Type: TypeAddress}}
		values := []AbiValue{"invalid"} // Invalid address

		_, err := EncodeAbiParameters(params, values)
		if err != ErrInvalidAddress {
			t.Errorf("Expected ErrInvalidAddress, got %v", err)
		}
	})

	t.Run("decode truncated data", func(t *testing.T) {
		params := []AbiParameter{{Type: TypeUint256}}
		data := []byte{0x01, 0x02} // Only 2 bytes, need 32

		_, err := DecodeAbiParameters(params, data)
		if err != ErrInvalidAbiLength {
			t.Errorf("Expected ErrInvalidAbiLength, got %v", err)
		}
	})
}

// Benchmark encoding
func BenchmarkEncodeAbiParameters(b *testing.B) {
	params := []AbiParameter{
		{Type: TypeAddress},
		{Type: TypeUint256},
		{Type: TypeString},
	}

	values := []AbiValue{
		"0x1234567890123456789012345678901234567890",
		big.NewInt(1000000),
		"Hello, Ethereum!",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = EncodeAbiParameters(params, values)
	}
}

// Benchmark decoding
func BenchmarkDecodeAbiParameters(b *testing.B) {
	params := []AbiParameter{
		{Type: TypeAddress},
		{Type: TypeUint256},
		{Type: TypeString},
	}

	values := []AbiValue{
		"0x1234567890123456789012345678901234567890",
		big.NewInt(1000000),
		"Hello, Ethereum!",
	}

	encoded, _ := EncodeAbiParameters(params, values)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = DecodeAbiParameters(params, encoded)
	}
}
