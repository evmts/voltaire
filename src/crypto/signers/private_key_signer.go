package signers

import (
	"crypto/rand"
	"errors"
	"fmt"

	"github.com/decred/dcrd/dcrec/secp256k1/v4"
	"github.com/decred/dcrd/dcrec/secp256k1/v4/ecdsa"
	"github.com/evmts/primitives/src/crypto"
)

var (
	ErrInvalidPrivateKey = errors.New("invalid private key")
	ErrSigningFailed     = errors.New("signing failed")
)

// PrivateKeySigner signs transactions and messages using a private key.
//
// SECURITY CRITICAL:
// - Private keys are stored in memory and should be cleared after use
// - Uses decred/secp256k1 library (well-audited, deterministic signing)
// - Implements EIP-2 (no malleable signatures)
// - Supports EIP-191 (personal message signing)
type PrivateKeySigner struct {
	privateKey *secp256k1.PrivateKey
	publicKey  *secp256k1.PublicKey
	address    [20]byte
}

// NewPrivateKeySigner creates a signer from a 32-byte private key.
//
// Parameters:
//   - privateKeyBytes: 32-byte private key
//
// Returns:
//   - *PrivateKeySigner: Initialized signer
//   - error: ErrInvalidPrivateKey if key is invalid
func NewPrivateKeySigner(privateKeyBytes [32]byte) (*PrivateKeySigner, error) {
	// Validate and create private key
	privateKey := secp256k1.PrivKeyFromBytes(privateKeyBytes[:])

	// Derive public key
	publicKey := privateKey.PubKey()

	// Derive Ethereum address
	address := deriveAddress(publicKey)

	return &PrivateKeySigner{
		privateKey: privateKey,
		publicKey:  publicKey,
		address:    address,
	}, nil
}

// Random generates a new random private key signer.
//
// Returns:
//   - *PrivateKeySigner: Initialized signer with random key
//   - error: if random number generation fails
func Random() (*PrivateKeySigner, error) {
	var privateKeyBytes [32]byte
	_, err := rand.Read(privateKeyBytes[:])
	if err != nil {
		return nil, fmt.Errorf("failed to generate random key: %w", err)
	}

	return NewPrivateKeySigner(privateKeyBytes)
}

// Address returns the Ethereum address associated with this signer.
func (s *PrivateKeySigner) Address() [20]byte {
	return s.address
}

// GetPrivateKey returns the private key bytes.
//
// SECURITY WARNING: This exposes the private key. Use with extreme caution.
// Consider using SecureZero() on the returned bytes after use.
func (s *PrivateKeySigner) GetPrivateKey() [32]byte {
	var key [32]byte
	copy(key[:], s.privateKey.Serialize())
	return key
}

// GetPublicKey returns the uncompressed public key (64 bytes: x || y).
func (s *PrivateKeySigner) GetPublicKey() [64]byte {
	var pubkey [64]byte

	// Get uncompressed public key (65 bytes: 0x04 || x || y)
	uncompressed := s.publicKey.SerializeUncompressed()

	// Skip the 0x04 prefix byte
	copy(pubkey[:], uncompressed[1:])

	return pubkey
}

// SignMessageHash signs a pre-hashed message.
//
// Parameters:
//   - hash: 32-byte message hash
//
// Returns:
//   - r, s: 32-byte signature components
//   - v: recovery ID (0 or 1)
//   - error: if signing fails
func (signer *PrivateKeySigner) SignMessageHash(hash [32]byte) (r, s [32]byte, v byte, err error) {
	// Sign the hash using RFC 6979 deterministic signing
	signature := ecdsa.Sign(signer.privateKey, hash[:])

	// Extract r and s components as fixed arrays
	sigR := signature.R()
	sigS := signature.S()
	r = sigR.Bytes()
	s = sigS.Bytes()

	// Calculate recovery ID
	// We need to try both recovery IDs and see which one recovers to our public key
	recoveryID, err := calculateRecoveryID(hash, r, s, signer.address)
	if err != nil {
		return r, s, 0, fmt.Errorf("failed to calculate recovery ID: %w", err)
	}

	v = recoveryID
	return r, s, v, nil
}

// SignMessage signs a message using EIP-191 personal message format.
//
// The message is prefixed with "\x19Ethereum Signed Message:\n{length}"
// before hashing and signing.
//
// Parameters:
//   - message: Message bytes to sign
//
// Returns:
//   - [65]byte: Signature (r || s || v)
//   - error: if signing fails
func (signer *PrivateKeySigner) SignMessage(message []byte) ([65]byte, error) {
	// Hash the message using EIP-191 format
	hash := eip191Hash(message)

	// Sign the hash
	r, s, v, err := signer.SignMessageHash(hash)
	if err != nil {
		return [65]byte{}, err
	}

	// Serialize to 65 bytes (r || s || v+27)
	// Note: EIP-191 uses v = 27 or 28 (add 27 to recovery ID)
	return crypto.SignatureToBytes(r, s, v+27), nil
}

// SignTransaction signs a transaction.
//
// Parameters:
//   - tx: Transaction to sign
//
// Returns:
//   - r, s: 32-byte signature components
//   - v: recovery ID
//   - error: if signing fails
func (signer *PrivateKeySigner) SignTransaction(tx Transaction) (r, s [32]byte, v byte, err error) {
	// Get the transaction hash to sign
	hash := tx.GetSignatureHash()

	// Sign the hash
	return signer.SignMessageHash(hash)
}

// Destroy securely zeros the private key in memory.
//
// SECURITY: Call this when the signer is no longer needed.
func (s *PrivateKeySigner) Destroy() {
	if s.privateKey != nil {
		// Zero the private key bytes
		keyBytes := s.privateKey.Serialize()
		crypto.SecureZero(keyBytes)
		s.privateKey = nil
	}
}

// deriveAddress derives an Ethereum address from a public key.
//
// Address = Keccak256(pubkey)[12:]
func deriveAddress(pubkey *secp256k1.PublicKey) [20]byte {
	// Get uncompressed public key (65 bytes: 0x04 || x || y)
	uncompressed := pubkey.SerializeUncompressed()

	// Skip the 0x04 prefix byte, hash the 64-byte x||y coordinates
	hash := crypto.Keccak256(uncompressed[1:])

	// Take last 20 bytes
	var address [20]byte
	copy(address[:], hash[12:])

	return address
}

// eip191Hash hashes a message using EIP-191 personal message format.
//
// Format: keccak256("\x19Ethereum Signed Message:\n{length}{message}")
func eip191Hash(message []byte) [32]byte {
	// Build the EIP-191 prefix
	prefix := fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(message))

	// Concatenate prefix + message
	data := append([]byte(prefix), message...)

	// Hash with Keccak-256
	return crypto.Keccak256(data)
}

// calculateRecoveryID determines which recovery ID (0 or 1) produces the correct address.
func calculateRecoveryID(hash, r, s [32]byte, expectedAddress [20]byte) (byte, error) {
	// Try recovery ID 0
	recoveredAddr0, err0 := crypto.RecoverAddress(hash, r, s, 0)
	if err0 == nil && recoveredAddr0 == expectedAddress {
		return 0, nil
	}

	// Try recovery ID 1
	recoveredAddr1, err1 := crypto.RecoverAddress(hash, r, s, 1)
	if err1 == nil && recoveredAddr1 == expectedAddress {
		return 1, nil
	}

	// Neither recovery ID worked
	return 0, fmt.Errorf("could not determine recovery ID")
}
