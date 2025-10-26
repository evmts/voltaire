package crypto

import (
	"encoding/hex"
	"testing"
)

// TestKeccak256Empty tests hashing empty bytes
func TestKeccak256Empty(t *testing.T) {
	data := []byte{}
	result := Keccak256(data)
	expected := "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("Keccak256 empty hash mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestKeccak256EmptyConstant tests the empty hash constant
func TestKeccak256EmptyConstant(t *testing.T) {
	expected := "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
	if Keccak256Empty != expected {
		t.Errorf("Keccak256Empty constant mismatch\nExpected: %s\nGot:      %s", expected, Keccak256Empty)
	}
}

// TestKeccak256SimpleString tests hashing a simple string "hello"
func TestKeccak256SimpleString(t *testing.T) {
	// "hello" = 0x68656c6c6f
	data := []byte{0x68, 0x65, 0x6c, 0x6c, 0x6f}
	result := Keccak256(data)
	expected := "1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("Keccak256 'hello' hash mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestKeccak256NISTVector1 tests NIST test vector 1 (empty message)
func TestKeccak256NISTVector1(t *testing.T) {
	data := []byte{}
	result := Keccak256(data)
	expected := "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("NIST Vector 1 mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestKeccak256NISTVector2 tests NIST test vector 2 (single byte 0xcc)
func TestKeccak256NISTVector2(t *testing.T) {
	data := []byte{0xcc}
	result := Keccak256(data)
	expected := "eead6dbfc7340a56caedc044696a168870549a6a7f6f56961e84a54bd9970b8a"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("NIST Vector 2 mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestKeccak256NISTVector3 tests NIST test vector 3 (two bytes: 0x41fb)
func TestKeccak256NISTVector3(t *testing.T) {
	data := []byte{0x41, 0xfb}
	result := Keccak256(data)
	expected := "a8eaceda4d47b3281a795ad9e1ea2122b407baf9aabcb9e18b5717b7873537d2"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("NIST Vector 3 mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestKeccak256LongData tests hashing 200 bytes of 0xa3
func TestKeccak256LongData(t *testing.T) {
	data := make([]byte, 200)
	for i := range data {
		data[i] = 0xa3
	}
	result := Keccak256(data)
	expected := "3a57666b048777f2c953dc4456f45a2588e1cb6f2da760122d530ac2ce607d4a"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("Long data hash mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestKeccak256Consistency tests that the same input produces the same output
func TestKeccak256Consistency(t *testing.T) {
	data := []byte("test message")
	hash1 := Keccak256(data)
	hash2 := Keccak256(data)

	if hash1 != hash2 {
		t.Errorf("Keccak256 produced inconsistent results for same input")
	}
}

// TestKeccak256Hex tests the hex string output function
func TestKeccak256Hex(t *testing.T) {
	data := []byte{0x68, 0x65, 0x6c, 0x6c, 0x6f} // "hello"
	result := Keccak256Hex(data)
	expected := "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"

	if result != expected {
		t.Errorf("Keccak256Hex mismatch\nExpected: %s\nGot:      %s", expected, result)
	}
}

// TestHashToHex tests converting a hash to hex string
func TestHashToHex(t *testing.T) {
	// Create a hash from known bytes
	var hash [32]byte
	for i := 0; i < 32; i++ {
		hash[i] = byte(i)
	}

	result := HashToHex(hash)
	// Should be "0x" + 64 hex chars
	if len(result) != 66 {
		t.Errorf("HashToHex result length mismatch. Expected 66, got %d", len(result))
	}
	if result[:2] != "0x" {
		t.Errorf("HashToHex result should start with '0x', got '%s'", result[:2])
	}

	// Verify it starts with correct bytes
	expected := "0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
	if result != expected {
		t.Errorf("HashToHex mismatch\nExpected: %s\nGot:      %s", expected, result)
	}
}

// BenchmarkKeccak256Empty benchmarks hashing empty bytes
func BenchmarkKeccak256Empty(b *testing.B) {
	data := []byte{}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = Keccak256(data)
	}
}

// BenchmarkKeccak256Short benchmarks hashing short data (32 bytes)
func BenchmarkKeccak256Short(b *testing.B) {
	data := make([]byte, 32)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = Keccak256(data)
	}
}

// BenchmarkKeccak256Medium benchmarks hashing medium data (256 bytes)
func BenchmarkKeccak256Medium(b *testing.B) {
	data := make([]byte, 256)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = Keccak256(data)
	}
}

// BenchmarkKeccak256Long benchmarks hashing long data (4096 bytes)
func BenchmarkKeccak256Long(b *testing.B) {
	data := make([]byte, 4096)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = Keccak256(data)
	}
}
