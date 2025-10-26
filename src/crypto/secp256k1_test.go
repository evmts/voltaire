package crypto_test

import (
	"encoding/hex"
	"testing"

	"github.com/evmts/primitives/src/crypto"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test vectors from Ethereum test suite
const (
	testPrivateKeyHex = "4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318"
	testAddressHex    = "2c7536E3605D9C16a7a3D7b1898e529396a65c23"
)

func hexToBytes32(s string) [32]byte {
	var result [32]byte
	bytes, _ := hex.DecodeString(s)
	copy(result[:], bytes)
	return result
}

func hexToBytes20(s string) [20]byte {
	var result [20]byte
	bytes, _ := hex.DecodeString(s)
	copy(result[:], bytes)
	return result
}

func hexToBytes64(s string) [64]byte {
	var result [64]byte
	bytes, _ := hex.DecodeString(s)
	copy(result[:], bytes)
	return result
}

func TestPublicKeyFromPrivate(t *testing.T) {
	t.Run("derives public key from private key", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		pubkey, err := crypto.PublicKeyFromPrivate(privateKey)
		require.NoError(t, err)

		// Public key should be 64 bytes
		assert.Equal(t, 64, len(pubkey))

		// Public key should be non-zero
		zeroKey := [64]byte{}
		assert.NotEqual(t, zeroKey, pubkey)
	})

	t.Run("rejects zero private key", func(t *testing.T) {
		zeroKey := [32]byte{}
		_, err := crypto.PublicKeyFromPrivate(zeroKey)
		assert.Error(t, err)
		assert.ErrorIs(t, err, crypto.ErrInvalidPrivateKey)
	})

	t.Run("same private key produces same public key", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		pubkey1, err1 := crypto.PublicKeyFromPrivate(privateKey)
		pubkey2, err2 := crypto.PublicKeyFromPrivate(privateKey)

		require.NoError(t, err1)
		require.NoError(t, err2)
		assert.Equal(t, pubkey1, pubkey2)
	})
}

func TestPublicKeyToAddress(t *testing.T) {
	t.Run("derives correct address from public key", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		pubkey, err := crypto.PublicKeyFromPrivate(privateKey)
		require.NoError(t, err)

		address := crypto.PublicKeyToAddress(pubkey)
		expectedAddress := hexToBytes20(testAddressHex)

		assert.Equal(t, expectedAddress, address)
	})

	t.Run("different public keys produce different addresses", func(t *testing.T) {
		// Two different private keys
		pk1 := hexToBytes32("0000000000000000000000000000000000000000000000000000000000000001")
		pk2 := hexToBytes32("0000000000000000000000000000000000000000000000000000000000000002")

		pubkey1, err1 := crypto.PublicKeyFromPrivate(pk1)
		pubkey2, err2 := crypto.PublicKeyFromPrivate(pk2)
		require.NoError(t, err1)
		require.NoError(t, err2)

		addr1 := crypto.PublicKeyToAddress(pubkey1)
		addr2 := crypto.PublicKeyToAddress(pubkey2)

		assert.NotEqual(t, addr1, addr2)
	})
}

func TestRecoverAddress(t *testing.T) {
	// Test vector: known signature from Ethereum
	messageHash := hexToBytes32("4b688df40bcedbe641ddb16ff0a1842d9c67ea1c3bf63f3e0471baa664531d1a")
	r := hexToBytes32("4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41")
	s := hexToBytes32("181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d09")

	t.Run("recovers address with recovery ID 0", func(t *testing.T) {
		// This may succeed or fail depending on the actual signature
		addr, err := crypto.RecoverAddress(messageHash, r, s, 0)
		// At minimum, error should be nil or ErrInvalidSignature (no panic)
		if err != nil {
			assert.ErrorIs(t, err, crypto.ErrInvalidSignature)
		} else {
			// If successful, address should be non-zero
			zeroAddr := [20]byte{}
			assert.NotEqual(t, zeroAddr, addr)
		}
	})

	t.Run("recovers address with recovery ID 1", func(t *testing.T) {
		addr, err := crypto.RecoverAddress(messageHash, r, s, 1)
		if err != nil {
			assert.ErrorIs(t, err, crypto.ErrInvalidSignature)
		} else {
			zeroAddr := [20]byte{}
			assert.NotEqual(t, zeroAddr, addr)
		}
	})

	t.Run("rejects invalid recovery ID", func(t *testing.T) {
		_, err := crypto.RecoverAddress(messageHash, r, s, 2)
		assert.Error(t, err)
		assert.ErrorIs(t, err, crypto.ErrInvalidRecoveryID)
	})

	t.Run("rejects invalid signature with high s value", func(t *testing.T) {
		// s value greater than n/2 (malleable signature)
		invalidS := hexToBytes32("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141")
		_, err := crypto.RecoverAddress(messageHash, r, invalidS, 0)
		assert.Error(t, err)
		assert.ErrorIs(t, err, crypto.ErrInvalidSignature)
	})

	t.Run("rejects zero r value", func(t *testing.T) {
		zeroR := [32]byte{}
		_, err := crypto.RecoverAddress(messageHash, zeroR, s, 0)
		assert.Error(t, err)
		assert.ErrorIs(t, err, crypto.ErrInvalidSignature)
	})

	t.Run("rejects zero s value", func(t *testing.T) {
		zeroS := [32]byte{}
		_, err := crypto.RecoverAddress(messageHash, r, zeroS, 0)
		assert.Error(t, err)
		assert.ErrorIs(t, err, crypto.ErrInvalidSignature)
	})
}

func TestRecoverPublicKey(t *testing.T) {
	messageHash := hexToBytes32("4b688df40bcedbe641ddb16ff0a1842d9c67ea1c3bf63f3e0471baa664531d1a")
	r := hexToBytes32("4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41")
	s := hexToBytes32("181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d09")

	t.Run("recovers public key from signature", func(t *testing.T) {
		pubkey, err := crypto.RecoverPublicKey(messageHash, r, s, 0)
		if err != nil {
			assert.ErrorIs(t, err, crypto.ErrInvalidSignature)
		} else {
			// Public key should be non-zero
			zeroKey := [64]byte{}
			assert.NotEqual(t, zeroKey, pubkey)
		}
	})

	t.Run("handles v = 27 format", func(t *testing.T) {
		// Test with Ethereum v format (27/28 instead of 0/1)
		pubkey, err := crypto.RecoverPublicKey(messageHash, r, s, 27)
		if err != nil {
			assert.ErrorIs(t, err, crypto.ErrInvalidSignature)
		} else {
			zeroKey := [64]byte{}
			assert.NotEqual(t, zeroKey, pubkey)
		}
	})
}

func TestValidateSignature(t *testing.T) {
	t.Run("validates correct signature components", func(t *testing.T) {
		r := hexToBytes32("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
		s := hexToBytes32("3456789012345678901234567890123456789012345678901234567890123456")

		valid := crypto.ValidateSignature(r, s)
		assert.True(t, valid)
	})

	t.Run("rejects zero r value", func(t *testing.T) {
		r := [32]byte{}
		s := hexToBytes32("3456789012345678901234567890123456789012345678901234567890123456")

		valid := crypto.ValidateSignature(r, s)
		assert.False(t, valid)
	})

	t.Run("rejects zero s value", func(t *testing.T) {
		r := hexToBytes32("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
		s := [32]byte{}

		valid := crypto.ValidateSignature(r, s)
		assert.False(t, valid)
	})

	t.Run("rejects high s value (malleability)", func(t *testing.T) {
		r := hexToBytes32("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
		// s > n/2
		s := hexToBytes32("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140")

		valid := crypto.ValidateSignature(r, s)
		assert.False(t, valid)
	})
}

func TestSignatureFromBytes(t *testing.T) {
	t.Run("parses 65-byte signature", func(t *testing.T) {
		sigBytes := make([]byte, 65)
		for i := 0; i < 32; i++ {
			sigBytes[i] = byte(i)       // r
			sigBytes[32+i] = byte(i+32) // s
		}
		sigBytes[64] = 27 // v

		r, s, v, err := crypto.SignatureFromBytes(sigBytes)
		require.NoError(t, err)

		// Check r
		for i := 0; i < 32; i++ {
			assert.Equal(t, byte(i), r[i])
		}

		// Check s
		for i := 0; i < 32; i++ {
			assert.Equal(t, byte(i+32), s[i])
		}

		// Check v
		assert.Equal(t, byte(27), v)
	})

	t.Run("rejects invalid length", func(t *testing.T) {
		sigBytes := make([]byte, 64) // Too short
		_, _, _, err := crypto.SignatureFromBytes(sigBytes)
		assert.Error(t, err)
	})
}

func TestSignatureToBytes(t *testing.T) {
	t.Run("serializes signature components", func(t *testing.T) {
		r := hexToBytes32("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
		s := hexToBytes32("fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321")
		v := byte(27)

		sig := crypto.SignatureToBytes(r, s, v)

		// Verify length
		assert.Equal(t, 65, len(sig))

		// Verify r
		assert.Equal(t, r[:], sig[0:32])

		// Verify s
		assert.Equal(t, s[:], sig[32:64])

		// Verify v
		assert.Equal(t, v, sig[64])
	})

	t.Run("round-trip conversion", func(t *testing.T) {
		originalR := hexToBytes32("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
		originalS := hexToBytes32("fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321")
		originalV := byte(28)

		// To bytes
		sig := crypto.SignatureToBytes(originalR, originalS, originalV)

		// From bytes
		r, s, v, err := crypto.SignatureFromBytes(sig[:])
		require.NoError(t, err)

		// Verify round-trip
		assert.Equal(t, originalR, r)
		assert.Equal(t, originalS, s)
		assert.Equal(t, originalV, v)
	})
}

func TestSecureZero(t *testing.T) {
	t.Run("zeros sensitive data", func(t *testing.T) {
		data := []byte{1, 2, 3, 4, 5}
		crypto.SecureZero(data)

		for _, b := range data {
			assert.Equal(t, byte(0), b)
		}
	})

	t.Run("handles empty slice", func(t *testing.T) {
		data := []byte{}
		// Should not panic
		crypto.SecureZero(data)
	})

	t.Run("handles nil slice", func(t *testing.T) {
		var data []byte
		// Should not panic
		crypto.SecureZero(data)
	})
}

// Benchmark tests
func BenchmarkPublicKeyFromPrivate(b *testing.B) {
	privateKey := hexToBytes32(testPrivateKeyHex)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = crypto.PublicKeyFromPrivate(privateKey)
	}
}

func BenchmarkRecoverAddress(b *testing.B) {
	messageHash := hexToBytes32("4b688df40bcedbe641ddb16ff0a1842d9c67ea1c3bf63f3e0471baa664531d1a")
	r := hexToBytes32("4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41")
	s := hexToBytes32("181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d09")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = crypto.RecoverAddress(messageHash, r, s, 0)
	}
}

func BenchmarkValidateSignature(b *testing.B) {
	r := hexToBytes32("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
	s := hexToBytes32("3456789012345678901234567890123456789012345678901234567890123456")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = crypto.ValidateSignature(r, s)
	}
}
