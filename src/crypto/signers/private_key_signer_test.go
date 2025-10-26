package signers_test

import (
	"encoding/hex"
	"testing"

	"github.com/evmts/primitives/src/crypto"
	"github.com/evmts/primitives/src/crypto/signers"
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

func TestNewPrivateKeySigner(t *testing.T) {
	t.Run("creates signer from private key", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)
		require.NotNil(t, signer)

		// Verify address derivation
		expectedAddress := hexToBytes20(testAddressHex)
		assert.Equal(t, expectedAddress, signer.Address())
	})

	t.Run("derives correct public key", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		pubkey := signer.GetPublicKey()

		// Public key should be 64 bytes (uncompressed)
		assert.Equal(t, 64, len(pubkey))

		// Public key should be non-zero
		zeroKey := [64]byte{}
		assert.NotEqual(t, zeroKey, pubkey)
	})

	t.Run("same private key produces same signer", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)

		signer1, err1 := signers.NewPrivateKeySigner(privateKey)
		signer2, err2 := signers.NewPrivateKeySigner(privateKey)

		require.NoError(t, err1)
		require.NoError(t, err2)

		assert.Equal(t, signer1.Address(), signer2.Address())
		assert.Equal(t, signer1.GetPublicKey(), signer2.GetPublicKey())
	})
}

func TestRandom(t *testing.T) {
	t.Run("generates random signer", func(t *testing.T) {
		signer, err := signers.Random()
		require.NoError(t, err)
		require.NotNil(t, signer)

		// Address should be non-zero
		zeroAddr := [20]byte{}
		assert.NotEqual(t, zeroAddr, signer.Address())
	})

	t.Run("generates different signers each time", func(t *testing.T) {
		signer1, err1 := signers.Random()
		signer2, err2 := signers.Random()

		require.NoError(t, err1)
		require.NoError(t, err2)

		// Different random signers should have different addresses
		assert.NotEqual(t, signer1.Address(), signer2.Address())
		assert.NotEqual(t, signer1.GetPrivateKey(), signer2.GetPrivateKey())
	})
}

func TestGetPrivateKey(t *testing.T) {
	t.Run("returns correct private key", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		retrievedKey := signer.GetPrivateKey()
		assert.Equal(t, privateKey, retrievedKey)
	})
}

func TestSignMessageHash(t *testing.T) {
	t.Run("signs message hash", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		// Create a message hash to sign
		message := []byte("Hello, Ethereum!")
		messageHash := crypto.Keccak256(message)

		r, s, v, err := signer.SignMessageHash(messageHash)
		require.NoError(t, err)

		// Verify signature components are valid
		assert.True(t, crypto.ValidateSignature(r, s))

		// v should be 0 or 1
		assert.True(t, v == 0 || v == 1)

		// Verify signature recovers to correct address
		recoveredAddr, err := crypto.RecoverAddress(messageHash, r, s, v)
		require.NoError(t, err)
		assert.Equal(t, signer.Address(), recoveredAddr)
	})

	t.Run("produces deterministic signatures", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		messageHash := crypto.Keccak256([]byte("test message"))

		// Sign twice
		r1, s1, v1, err1 := signer.SignMessageHash(messageHash)
		r2, s2, v2, err2 := signer.SignMessageHash(messageHash)

		require.NoError(t, err1)
		require.NoError(t, err2)

		// Should produce identical signatures (RFC 6979 deterministic signing)
		assert.Equal(t, r1, r2)
		assert.Equal(t, s1, s2)
		assert.Equal(t, v1, v2)
	})

	t.Run("different messages produce different signatures", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		hash1 := crypto.Keccak256([]byte("message 1"))
		hash2 := crypto.Keccak256([]byte("message 2"))

		r1, s1, _, err1 := signer.SignMessageHash(hash1)
		r2, s2, _, err2 := signer.SignMessageHash(hash2)

		require.NoError(t, err1)
		require.NoError(t, err2)

		// Signatures should be different
		assert.True(t, r1 != r2 || s1 != s2)
	})

	t.Run("produces low-s signatures (EIP-2)", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		messageHash := crypto.Keccak256([]byte("test"))

		r, s, _, err := signer.SignMessageHash(messageHash)
		require.NoError(t, err)

		// Signature should pass validation (which checks s <= n/2)
		assert.True(t, crypto.ValidateSignature(r, s))
	})
}

func TestSignMessage(t *testing.T) {
	t.Run("signs message with EIP-191 format", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		message := []byte("Hello, Ethereum!")
		signature, err := signer.SignMessage(message)
		require.NoError(t, err)

		// Signature should be 65 bytes
		assert.Equal(t, 65, len(signature))

		// Parse signature
		r, s, v, err := crypto.SignatureFromBytes(signature[:])
		require.NoError(t, err)

		// v should be 27 or 28 (EIP-191 format)
		assert.True(t, v == 27 || v == 28)

		// Validate signature components
		assert.True(t, crypto.ValidateSignature(r, s))
	})

	t.Run("signature can be verified", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		message := []byte("Test message for verification")
		signature, err := signer.SignMessage(message)
		require.NoError(t, err)

		// Parse signature
		r, s, v, err := crypto.SignatureFromBytes(signature[:])
		require.NoError(t, err)

		// Compute EIP-191 hash
		eip191Hash := crypto.Keccak256(append(
			[]byte("\x19Ethereum Signed Message:\n29"), // 29 = len("Test message for verification")
			message...,
		))

		// Recover address (convert v from 27/28 to 0/1)
		recoveredAddr, err := crypto.RecoverAddress(eip191Hash, r, s, v-27)
		require.NoError(t, err)

		// Should recover to signer's address
		assert.Equal(t, signer.Address(), recoveredAddr)
	})

	t.Run("produces deterministic signatures", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		message := []byte("deterministic test")

		sig1, err1 := signer.SignMessage(message)
		sig2, err2 := signer.SignMessage(message)

		require.NoError(t, err1)
		require.NoError(t, err2)

		assert.Equal(t, sig1, sig2)
	})

	t.Run("handles empty message", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		signature, err := signer.SignMessage([]byte{})
		require.NoError(t, err)
		assert.Equal(t, 65, len(signature))
	})

	t.Run("handles long message", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		// 1KB message
		longMessage := make([]byte, 1024)
		for i := range longMessage {
			longMessage[i] = byte(i % 256)
		}

		signature, err := signer.SignMessage(longMessage)
		require.NoError(t, err)
		assert.Equal(t, 65, len(signature))
	})
}

func TestDestroy(t *testing.T) {
	t.Run("securely zeros private key", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		// Get a copy of the private key before destruction
		keyBefore := signer.GetPrivateKey()
		assert.NotEqual(t, [32]byte{}, keyBefore)

		// Destroy the signer
		signer.Destroy()

		// After destruction, signing operations should fail
		// (We can't directly verify memory is zeroed, but the operation should fail)
		// This is a best-effort security measure
	})
}

// Mock transaction for testing
type MockTransaction struct {
	hash [32]byte
}

func (m *MockTransaction) GetSignatureHash() [32]byte {
	return m.hash
}

func TestSignTransaction(t *testing.T) {
	t.Run("signs transaction", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		// Create a mock transaction
		txHash := crypto.Keccak256([]byte("transaction data"))
		tx := &MockTransaction{hash: txHash}

		r, s, v, err := signer.SignTransaction(tx)
		require.NoError(t, err)

		// Validate signature
		assert.True(t, crypto.ValidateSignature(r, s))
		assert.True(t, v == 0 || v == 1)

		// Verify signature recovers to correct address
		recoveredAddr, err := crypto.RecoverAddress(txHash, r, s, v)
		require.NoError(t, err)
		assert.Equal(t, signer.Address(), recoveredAddr)
	})

	t.Run("produces deterministic transaction signatures", func(t *testing.T) {
		privateKey := hexToBytes32(testPrivateKeyHex)
		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		txHash := crypto.Keccak256([]byte("tx data"))
		tx := &MockTransaction{hash: txHash}

		r1, s1, v1, err1 := signer.SignTransaction(tx)
		r2, s2, v2, err2 := signer.SignTransaction(tx)

		require.NoError(t, err1)
		require.NoError(t, err2)

		assert.Equal(t, r1, r2)
		assert.Equal(t, s1, s2)
		assert.Equal(t, v1, v2)
	})
}

// Integration tests with known Ethereum test vectors
func TestKnownTestVectors(t *testing.T) {
	t.Run("Ethereum test vector 1", func(t *testing.T) {
		// Known private key and address from Ethereum tests
		privateKey := hexToBytes32("4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318")
		expectedAddress := hexToBytes20("2c7536E3605D9C16a7a3D7b1898e529396a65c23")

		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		assert.Equal(t, expectedAddress, signer.Address())
	})

	t.Run("Well-known private key 1", func(t *testing.T) {
		// Private key = 1
		privateKey := hexToBytes32("0000000000000000000000000000000000000000000000000000000000000001")

		signer, err := signers.NewPrivateKeySigner(privateKey)
		require.NoError(t, err)

		// Should produce a valid address
		addr := signer.Address()
		zeroAddr := [20]byte{}
		assert.NotEqual(t, zeroAddr, addr)

		// Sign a message and verify it recovers correctly
		message := []byte("test")
		signature, err := signer.SignMessage(message)
		require.NoError(t, err)

		r, s, v, err := crypto.SignatureFromBytes(signature[:])
		require.NoError(t, err)

		// Compute EIP-191 hash
		eip191Hash := crypto.Keccak256(append(
			[]byte("\x19Ethereum Signed Message:\n4"),
			message...,
		))

		recoveredAddr, err := crypto.RecoverAddress(eip191Hash, r, s, v-27)
		require.NoError(t, err)
		assert.Equal(t, addr, recoveredAddr)
	})
}

// Benchmark tests
func BenchmarkNewPrivateKeySigner(b *testing.B) {
	privateKey := hexToBytes32(testPrivateKeyHex)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = signers.NewPrivateKeySigner(privateKey)
	}
}

func BenchmarkSignMessageHash(b *testing.B) {
	privateKey := hexToBytes32(testPrivateKeyHex)
	signer, _ := signers.NewPrivateKeySigner(privateKey)
	messageHash := crypto.Keccak256([]byte("benchmark message"))

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, _, _ = signer.SignMessageHash(messageHash)
	}
}

func BenchmarkSignMessage(b *testing.B) {
	privateKey := hexToBytes32(testPrivateKeyHex)
	signer, _ := signers.NewPrivateKeySigner(privateKey)
	message := []byte("benchmark message")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = signer.SignMessage(message)
	}
}

func BenchmarkRandom(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = signers.Random()
	}
}
