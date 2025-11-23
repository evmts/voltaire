// Transaction Signature: Verify and recover sender
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example signed transaction (with real signature components)
const signedTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32).fill(1), // Signature r component
	s: new Uint8Array(32).fill(2), // Signature s component
};

// Check if transaction is signed
const signed = Transaction.isSigned(signedTx);
console.log("Is signed:", signed);

// Assert transaction is signed (throws if not)
try {
	Transaction.assertSigned(signedTx);
	console.log("Transaction is properly signed");
} catch (error) {
	console.log("Transaction not signed:", error);
}

// Verify signature is valid (cryptographic verification)
try {
	const isValid = Transaction.verifySignature(signedTx);
	console.log("Signature valid:", isValid);
} catch (error) {
	console.log("Signature verification failed (expected with dummy signature)");
}

// Recover sender address from signature
try {
	const sender = Transaction.getSender(signedTx);
	console.log("Recovered sender:", Hex.fromBytes(sender).toString());
} catch (error) {
	console.log("Cannot recover sender (expected with dummy signature)");
}

// Get chain ID from transaction
const chainId = Transaction.getChainId(signedTx);
console.log("Chain ID:", chainId);
