package crypto_test

import (
	"encoding/hex"
	"testing"

	"github.com/evmts/primitives/src/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSHA256(t *testing.T) {
	t.Run("hashes known test vector", func(t *testing.T) {
		// Known SHA-256 hash of "hello world"
		input := []byte("hello world")
		expected := "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"

		result := crypto.SHA256(input)
		resultHex := hex.EncodeToString(result[:])

		assert.Equal(t, expected, resultHex)
	})

	t.Run("hashes empty input", func(t *testing.T) {
		// Known SHA-256 hash of empty string
		expected := "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

		result := crypto.SHA256([]byte{})
		resultHex := hex.EncodeToString(result[:])

		assert.Equal(t, expected, resultHex)
	})

	t.Run("hashes abc", func(t *testing.T) {
		// Known SHA-256 hash of "abc"
		input := []byte("abc")
		expected := "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"

		result := crypto.SHA256(input)
		resultHex := hex.EncodeToString(result[:])

		assert.Equal(t, expected, resultHex)
	})

	t.Run("produces deterministic output", func(t *testing.T) {
		input := []byte("test message")

		hash1 := crypto.SHA256(input)
		hash2 := crypto.SHA256(input)

		assert.Equal(t, hash1, hash2)
	})

	t.Run("produces different hashes for different inputs", func(t *testing.T) {
		hash1 := crypto.SHA256([]byte("message1"))
		hash2 := crypto.SHA256([]byte("message2"))

		assert.NotEqual(t, hash1, hash2)
	})

	t.Run("output length is 32 bytes", func(t *testing.T) {
		result := crypto.SHA256([]byte("test"))
		assert.Equal(t, 32, len(result))
	})
}

func TestRIPEMD160(t *testing.T) {
	t.Run("hashes known test vector", func(t *testing.T) {
		// Known RIPEMD-160 hash of "abc"
		input := []byte("abc")
		expected := "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc"

		result := crypto.RIPEMD160(input)
		resultHex := hex.EncodeToString(result[:])

		assert.Equal(t, expected, resultHex)
	})

	t.Run("hashes empty input", func(t *testing.T) {
		// Known RIPEMD-160 hash of empty string
		expected := "9c1185a5c5e9fc54612808977ee8f548b2258d31"

		result := crypto.RIPEMD160([]byte{})
		resultHex := hex.EncodeToString(result[:])

		assert.Equal(t, expected, resultHex)
	})

	t.Run("hashes hello world", func(t *testing.T) {
		// Known RIPEMD-160 hash of "hello world"
		input := []byte("hello world")
		expected := "98c615784ccb5fe5936fbc0cbe9dfdb408d92f0f"

		result := crypto.RIPEMD160(input)
		resultHex := hex.EncodeToString(result[:])

		assert.Equal(t, expected, resultHex)
	})

	t.Run("produces deterministic output", func(t *testing.T) {
		input := []byte("test message")

		hash1 := crypto.RIPEMD160(input)
		hash2 := crypto.RIPEMD160(input)

		assert.Equal(t, hash1, hash2)
	})

	t.Run("produces different hashes for different inputs", func(t *testing.T) {
		hash1 := crypto.RIPEMD160([]byte("message1"))
		hash2 := crypto.RIPEMD160([]byte("message2"))

		assert.NotEqual(t, hash1, hash2)
	})

	t.Run("output length is 20 bytes", func(t *testing.T) {
		result := crypto.RIPEMD160([]byte("test"))
		assert.Equal(t, 20, len(result))
	})
}

func TestHash160(t *testing.T) {
	t.Run("computes HASH160 correctly", func(t *testing.T) {
		// HASH160 = RIPEMD160(SHA256(input))
		input := []byte("hello world")

		// Compute HASH160
		result := crypto.Hash160(input)

		// Verify by computing manually
		sha256Hash := crypto.SHA256(input)
		ripemd160Hash := crypto.RIPEMD160(sha256Hash[:])

		assert.Equal(t, ripemd160Hash, result)
	})

	t.Run("works with empty input", func(t *testing.T) {
		result := crypto.Hash160([]byte{})
		assert.Equal(t, 20, len(result))
	})

	t.Run("produces deterministic output", func(t *testing.T) {
		input := []byte("test")

		hash1 := crypto.Hash160(input)
		hash2 := crypto.Hash160(input)

		assert.Equal(t, hash1, hash2)
	})

	t.Run("known Bitcoin P2PKH example", func(t *testing.T) {
		// This tests HASH160 used in Bitcoin addresses
		// Using a known public key
		pubKeyHex := "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
		pubKey, err := hex.DecodeString(pubKeyHex)
		require.NoError(t, err)

		result := crypto.Hash160(pubKey)

		// Verify it's 20 bytes
		assert.Equal(t, 20, len(result))

		// Should be deterministic
		result2 := crypto.Hash160(pubKey)
		assert.Equal(t, result, result2)
	})
}

func TestDoubleSHA256(t *testing.T) {
	t.Run("computes double SHA-256 correctly", func(t *testing.T) {
		// Double SHA-256 = SHA256(SHA256(input))
		input := []byte("hello world")

		// Compute double SHA-256
		result := crypto.DoubleSHA256(input)

		// Verify by computing manually
		firstHash := crypto.SHA256(input)
		secondHash := crypto.SHA256(firstHash[:])

		assert.Equal(t, secondHash, result)
	})

	t.Run("works with empty input", func(t *testing.T) {
		result := crypto.DoubleSHA256([]byte{})
		assert.Equal(t, 32, len(result))

		// Verify it's actually double hashed
		firstHash := crypto.SHA256([]byte{})
		expected := crypto.SHA256(firstHash[:])
		assert.Equal(t, expected, result)
	})

	t.Run("produces deterministic output", func(t *testing.T) {
		input := []byte("test")

		hash1 := crypto.DoubleSHA256(input)
		hash2 := crypto.DoubleSHA256(input)

		assert.Equal(t, hash1, hash2)
	})

	t.Run("known Bitcoin block header example", func(t *testing.T) {
		// Bitcoin uses double SHA-256 for block header hashing
		// This is a simplified test - real block headers are 80 bytes
		data := []byte("bitcoin block header test")

		result := crypto.DoubleSHA256(data)

		// Verify it's 32 bytes
		assert.Equal(t, 32, len(result))

		// Should be deterministic
		result2 := crypto.DoubleSHA256(data)
		assert.Equal(t, result, result2)
	})

	t.Run("different from single SHA-256", func(t *testing.T) {
		input := []byte("test")

		singleHash := crypto.SHA256(input)
		doubleHash := crypto.DoubleSHA256(input)

		// Double hash should be different from single hash
		assert.NotEqual(t, singleHash, doubleHash)
	})
}

// Edge case tests
func TestHashAlgorithmsEdgeCases(t *testing.T) {
	t.Run("SHA256 with large input", func(t *testing.T) {
		// 1MB of data
		largeInput := make([]byte, 1024*1024)
		for i := range largeInput {
			largeInput[i] = byte(i % 256)
		}

		// Should not panic
		result := crypto.SHA256(largeInput)
		assert.Equal(t, 32, len(result))
	})

	t.Run("RIPEMD160 with large input", func(t *testing.T) {
		// 1MB of data
		largeInput := make([]byte, 1024*1024)
		for i := range largeInput {
			largeInput[i] = byte(i % 256)
		}

		// Should not panic
		result := crypto.RIPEMD160(largeInput)
		assert.Equal(t, 20, len(result))
	})

	t.Run("all zeros input", func(t *testing.T) {
		zeros := make([]byte, 1000)

		sha := crypto.SHA256(zeros)
		ripemd := crypto.RIPEMD160(zeros)
		hash160 := crypto.Hash160(zeros)
		doubleSha := crypto.DoubleSHA256(zeros)

		// Should produce deterministic non-zero results
		assert.Equal(t, 32, len(sha))
		assert.Equal(t, 20, len(ripemd))
		assert.Equal(t, 20, len(hash160))
		assert.Equal(t, 32, len(doubleSha))

		// Re-compute to verify determinism
		assert.Equal(t, sha, crypto.SHA256(zeros))
		assert.Equal(t, ripemd, crypto.RIPEMD160(zeros))
		assert.Equal(t, hash160, crypto.Hash160(zeros))
		assert.Equal(t, doubleSha, crypto.DoubleSHA256(zeros))
	})

	t.Run("single byte inputs", func(t *testing.T) {
		for i := byte(0); i < 255; i++ {
			input := []byte{i}

			// None of these should panic
			sha := crypto.SHA256(input)
			ripemd := crypto.RIPEMD160(input)

			assert.Equal(t, 32, len(sha))
			assert.Equal(t, 20, len(ripemd))
		}
	})
}

// Benchmark tests
func BenchmarkSHA256(b *testing.B) {
	input := []byte("The quick brown fox jumps over the lazy dog")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = crypto.SHA256(input)
	}
}

func BenchmarkRIPEMD160(b *testing.B) {
	input := []byte("The quick brown fox jumps over the lazy dog")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = crypto.RIPEMD160(input)
	}
}

func BenchmarkHash160(b *testing.B) {
	input := []byte("The quick brown fox jumps over the lazy dog")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = crypto.Hash160(input)
	}
}

func BenchmarkDoubleSHA256(b *testing.B) {
	input := []byte("The quick brown fox jumps over the lazy dog")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = crypto.DoubleSHA256(input)
	}
}

func BenchmarkSHA256Large(b *testing.B) {
	// 1KB input
	input := make([]byte, 1024)
	for i := range input {
		input[i] = byte(i % 256)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = crypto.SHA256(input)
	}
}
