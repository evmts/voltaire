import { Address, Hex, Transaction } from "voltaire";
// Transaction Hashing: Compute transaction and signing hashes

// Create transaction
const tx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 5n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Get signing hash (what gets signed by private key)
// This excludes signature fields to avoid circular dependency
const signingHash = Transaction.getSigningHash(tx);

// Compute transaction hash (includes signature)
const txHash = Transaction.hash(tx);

// Format transaction for display
const formatted = Transaction.format(tx);
