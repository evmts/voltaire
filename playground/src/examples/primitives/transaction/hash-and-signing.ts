// Transaction Hashing: Compute transaction and signing hashes
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

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
console.log("Signing hash:", Hex.fromBytes(signingHash).toString());
console.log("Signing hash length:", signingHash.length, "bytes (always 32)");

// Compute transaction hash (includes signature)
const txHash = Transaction.hash(tx);
console.log("Transaction hash:", Hex.fromBytes(txHash).toString());
console.log("Transaction hash length:", txHash.length, "bytes (always 32)");

// The signing hash is used to create the signature
// The transaction hash is the unique identifier after signing
console.log("Hashes are different:", signingHash !== txHash);

// Format transaction for display
const formatted = Transaction.format(tx);
console.log("Formatted transaction:");
console.log(formatted.slice(0, 200) + "...");
