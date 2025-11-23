// Transaction Replacement: Bump fees to replace pending transaction
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Original pending transaction
const pendingTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 5n, // Same nonce to replace
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
	maxFeePerGas: 30_000_000_000n, // 30 gwei
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

console.log("=== Original Pending Transaction ===");
console.log("Nonce:", pendingTx.nonce);
console.log("Max priority fee:", pendingTx.maxPriorityFeePerGas);
console.log("Max fee per gas:", pendingTx.maxFeePerGas);

// Replace with default 10% fee bump
const replaced = Transaction.replaceWith(pendingTx);
console.log("\n=== Replaced Transaction (default 10% bump) ===");
console.log("Nonce (same):", replaced.nonce);
if ("maxPriorityFeePerGas" in replaced) {
	console.log("Max priority fee:", replaced.maxPriorityFeePerGas);
	console.log(
		"Priority fee increase:",
		replaced.maxPriorityFeePerGas - pendingTx.maxPriorityFeePerGas,
	);
}
if ("maxFeePerGas" in replaced) {
	console.log("Max fee per gas:", replaced.maxFeePerGas);
	console.log(
		"Max fee increase:",
		replaced.maxFeePerGas - pendingTx.maxFeePerGas,
	);
}

// Replace with custom fee bump
const customReplaced = Transaction.replaceWith(pendingTx, {
	feeBumpPercent: 20, // 20% increase
});
console.log("\n=== Replaced Transaction (20% bump) ===");
if ("maxPriorityFeePerGas" in customReplaced) {
	console.log("Max priority fee:", customReplaced.maxPriorityFeePerGas);
}
if ("maxFeePerGas" in customReplaced) {
	console.log("Max fee per gas:", customReplaced.maxFeePerGas);
}

// For legacy transactions
const pendingLegacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 5n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

const replacedLegacy = Transaction.replaceWith(pendingLegacy);
console.log("\n=== Replaced Legacy Transaction ===");
console.log("Original gas price:", pendingLegacy.gasPrice);
console.log("New gas price:", replacedLegacy.gasPrice);
console.log("Increase:", replacedLegacy.gasPrice - pendingLegacy.gasPrice);
