package signers

// Transaction represents a transaction that can be signed.
// This is a simplified interface - in practice, you'd import the actual
// transaction type from the primitives package.
type Transaction interface {
	// GetSignatureHash returns the hash to be signed
	GetSignatureHash() [32]byte
}

// Signer is the interface that all signers must implement.
//
// A signer is responsible for:
// - Signing transactions with appropriate signature format
// - Signing messages using EIP-191 personal message format
// - Signing typed data using EIP-712 structured data format
// - Providing the associated Ethereum address
type Signer interface {
	// Address returns the Ethereum address associated with this signer
	Address() [20]byte

	// SignTransaction signs a transaction and returns the signature components.
	// Returns r, s (32 bytes each) and v (recovery ID).
	SignTransaction(tx Transaction) (r, s [32]byte, v byte, err error)

	// SignMessage signs a message using EIP-191 personal message format.
	// The message is prefixed with "\x19Ethereum Signed Message:\n{length}"
	// before hashing and signing.
	// Returns the 65-byte signature (r || s || v).
	SignMessage(message []byte) ([65]byte, error)

	// SignMessageHash signs a pre-hashed message.
	// Use this when you've already computed the message hash yourself.
	// Returns r, s (32 bytes each) and v (recovery ID).
	SignMessageHash(hash [32]byte) (r, s [32]byte, v byte, err error)
}
