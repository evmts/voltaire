import { Address, Hex, Transaction, Bytes, Bytes32 } from "@tevm/voltaire";
// Transaction Signature: Verify and recover sender

// Example signed transaction (with real signature components)
const signedTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21_000n,
	to: Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: Bytes.zero(0),
	accessList: [],
	yParity: 0,
	r: Bytes32.repeat(0x01), // Signature r component
	s: Bytes32.repeat(0x02), // Signature s component
};

// Check if transaction is signed
const signed = Transaction.isSigned(signedTx);

// Assert transaction is signed (throws if not)
try {
	Transaction.assertSigned(signedTx);
} catch (error) {}

// Verify signature is valid (cryptographic verification)
try {
	const isValid = Transaction.verifySignature(signedTx);
} catch (error) {}

// Recover sender address from signature
try {
	const sender = Transaction.getSender(signedTx);
} catch (error) {}

// Get chain ID from transaction
const chainId = Transaction.getChainId(signedTx);
