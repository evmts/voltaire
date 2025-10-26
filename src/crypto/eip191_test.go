package crypto

import (
	"encoding/hex"
	"testing"
)

// TestHashPersonalMessageSimple tests hashing a simple "hello" message
func TestHashPersonalMessageSimple(t *testing.T) {
	message := []byte("hello")
	result := HashPersonalMessage(message)
	// "\x19Ethereum Signed Message:\n5hello"
	expected := "50b2c43fd39106bafbba0da34fc430e1f91e3c96ea2acee2bc34119f92b37750"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("HashPersonalMessage 'hello' mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestHashPersonalMessageString tests the string convenience function
func TestHashPersonalMessageString(t *testing.T) {
	message := "hello"
	result := HashPersonalMessageString(message)
	expected := "50b2c43fd39106bafbba0da34fc430e1f91e3c96ea2acee2bc34119f92b37750"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("HashPersonalMessageString 'hello' mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestHashPersonalMessageHex tests the hex output function
func TestHashPersonalMessageHex(t *testing.T) {
	message := []byte("hello")
	result := HashPersonalMessageHex(message)
	expected := "0x50b2c43fd39106bafbba0da34fc430e1f91e3c96ea2acee2bc34119f92b37750"

	if result != expected {
		t.Errorf("HashPersonalMessageHex mismatch\nExpected: %s\nGot:      %s", expected, result)
	}
}

// TestHashPersonalMessageLonger tests hashing "Hello, World!"
func TestHashPersonalMessageLonger(t *testing.T) {
	message := []byte("Hello, World!")
	result := HashPersonalMessage(message)
	expected := "c8ee0d506e864589b799a645ddb88b08f5d39e8049f9f702b3b61fa15e55fc73"

	resultHex := hex.EncodeToString(result[:])
	if resultHex != expected {
		t.Errorf("HashPersonalMessage 'Hello, World!' mismatch\nExpected: %s\nGot:      %s", expected, resultHex)
	}
}

// TestHashPersonalMessageEmpty tests hashing an empty message
func TestHashPersonalMessageEmpty(t *testing.T) {
	message := []byte("")
	result := HashPersonalMessage(message)
	// "\x19Ethereum Signed Message:\n0"
	// Should produce a valid hash
	resultHex := hex.EncodeToString(result[:])

	// Verify it's a 32-byte hash (64 hex chars)
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}

	// Verify it's not all zeros
	allZeros := true
	for _, b := range result {
		if b != 0 {
			allZeros = false
			break
		}
	}
	if allZeros {
		t.Errorf("Hash should not be all zeros")
	}
}

// TestHashPersonalMessageConsistency tests that same input produces same output
func TestHashPersonalMessageConsistency(t *testing.T) {
	message := []byte("test message")
	hash1 := HashPersonalMessage(message)
	hash2 := HashPersonalMessage(message)

	if hash1 != hash2 {
		t.Errorf("HashPersonalMessage produced inconsistent results for same input")
	}
}

// TestHashPersonalMessageDifferent tests that different messages produce different hashes
func TestHashPersonalMessageDifferent(t *testing.T) {
	message1 := []byte("message1")
	message2 := []byte("message2")

	hash1 := HashPersonalMessage(message1)
	hash2 := HashPersonalMessage(message2)

	if hash1 == hash2 {
		t.Errorf("Different messages produced the same hash")
	}
}

// TestHashPersonalMessageUnicode tests handling unicode characters
func TestHashPersonalMessageUnicode(t *testing.T) {
	message := []byte("Hello 👋")
	result := HashPersonalMessage(message)

	// Should produce a valid hash
	resultHex := hex.EncodeToString(result[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashPersonalMessageBinaryData tests hashing arbitrary binary data
func TestHashPersonalMessageBinaryData(t *testing.T) {
	// Binary data with all byte values
	message := make([]byte, 256)
	for i := 0; i < 256; i++ {
		message[i] = byte(i)
	}

	result := HashPersonalMessage(message)

	// Should produce a valid hash
	resultHex := hex.EncodeToString(result[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashPersonalMessageVsKeccak256 verifies that personal message hash
// is different from plain Keccak-256
func TestHashPersonalMessageVsKeccak256(t *testing.T) {
	message := []byte("hello")

	personalHash := HashPersonalMessage(message)
	directHash := Keccak256(message)

	if personalHash == directHash {
		t.Errorf("Personal message hash should differ from direct Keccak-256")
	}
}

// BenchmarkHashPersonalMessageShort benchmarks hashing short messages
func BenchmarkHashPersonalMessageShort(b *testing.B) {
	message := []byte("hello")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = HashPersonalMessage(message)
	}
}

// BenchmarkHashPersonalMessageMedium benchmarks hashing medium messages
func BenchmarkHashPersonalMessageMedium(b *testing.B) {
	message := make([]byte, 256)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = HashPersonalMessage(message)
	}
}

// BenchmarkHashPersonalMessageLong benchmarks hashing long messages
// Note: Limited to 512 bytes due to C API stack buffer size (1024 bytes)
// The EIP-191 prefix overhead requires additional space
func BenchmarkHashPersonalMessageLong(b *testing.B) {
	message := make([]byte, 512)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = HashPersonalMessage(message)
	}
}
