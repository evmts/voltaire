// Transaction Modification: Create modified copies of transactions
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Original transaction
const original: Transaction.EIP1559 = {
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

console.log("=== Original Transaction ===");
console.log("Nonce:", original.nonce);
console.log("Gas limit:", original.gasLimit);
console.log("Max fee per gas:", original.maxFeePerGas);

// Update nonce (returns new transaction)
const withNewNonce = Transaction.withNonce(original, 5n);
console.log("\n=== After withNonce(5n) ===");
console.log("New nonce:", withNewNonce.nonce);
console.log("Original nonce unchanged:", original.nonce);

// Update gas limit
const withNewGasLimit = Transaction.withGasLimit(original, 50_000n);
console.log("\n=== After withGasLimit(50_000n) ===");
console.log("New gas limit:", withNewGasLimit.gasLimit);
console.log("Original gas limit unchanged:", original.gasLimit);

// Update gas price (for legacy transactions)
const legacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

const withNewGasPrice = Transaction.withGasPrice(legacy, 25_000_000_000n);
console.log("\n=== After withGasPrice(25_000_000_000n) ===");
console.log("New gas price:", withNewGasPrice.gasPrice);

// Update data
const functionCall = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]); // Function selector
const withNewData = Transaction.withData(original, functionCall);
console.log("\n=== After withData(functionCall) ===");
console.log("New data length:", withNewData.data.length);
console.log("Original data length unchanged:", original.data.length);

// All withX functions return new transactions - original is immutable
console.log("\n=== Immutability Check ===");
console.log("Original nonce still 0:", original.nonce === 0n);
console.log("Original gas limit still 21000:", original.gasLimit === 21_000n);
