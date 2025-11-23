// Transaction Validation: Validate transaction fields
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Create transaction to validate
const tx: Transaction.EIP1559 = {
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
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

console.log("=== Transaction Validation ===");

// Validate gas price
try {
	Transaction.validateGasPrice(tx);
	console.log("Gas price: VALID");
} catch (error) {
	console.log("Gas price: INVALID -", error);
}

// Validate gas limit
try {
	Transaction.validateGasLimit(tx);
	console.log("Gas limit: VALID");
} catch (error) {
	console.log("Gas limit: INVALID -", error);
}

// Validate nonce
try {
	Transaction.validateNonce(tx);
	console.log("Nonce: VALID");
} catch (error) {
	console.log("Nonce: INVALID -", error);
}

// Validate value
try {
	Transaction.validateValue(tx);
	console.log("Value: VALID");
} catch (error) {
	console.log("Value: INVALID -", error);
}

// Validate chain ID
try {
	Transaction.validateChainId(tx);
	console.log("Chain ID: VALID");
} catch (error) {
	console.log("Chain ID: INVALID -", error);
}

console.log("\n=== Field Constraints ===");
console.log(
	"maxPriorityFeePerGas <= maxFeePerGas:",
	tx.maxPriorityFeePerGas <= tx.maxFeePerGas,
);
console.log("gasLimit >= 21000 (intrinsic gas):", tx.gasLimit >= 21_000n);
console.log("nonce is non-negative:", tx.nonce >= 0n);
