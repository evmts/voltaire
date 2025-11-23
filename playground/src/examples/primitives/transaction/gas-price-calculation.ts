// Transaction Gas Price: Calculate effective gas prices
import * as Transaction from "../../../primitives/Transaction/index.js";
import * as Address from "../../../primitives/Address/index.js";

// Legacy transaction - fixed gas price
const legacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

console.log("=== Legacy Transaction ===");
const legacyGasPrice = Transaction.getGasPrice(legacy);
console.log("Gas price:", legacyGasPrice, "wei");
console.log("Max cost:", legacyGasPrice * legacy.gasLimit, "wei");

// EIP-1559 transaction - dynamic fee market
const eip1559: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip
	maxFeePerGas: 30_000_000_000n, // 30 gwei max
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

console.log("\n=== EIP-1559 Transaction ===");
console.log("Max priority fee:", eip1559.maxPriorityFeePerGas, "wei");
console.log("Max fee per gas:", eip1559.maxFeePerGas, "wei");

// Calculate effective gas price with different base fees
const baseFee1 = 15_000_000_000n; // 15 gwei (low congestion)
const effectiveGasPrice1 = Transaction.getGasPrice(eip1559, baseFee1);
console.log("\nBase fee 15 gwei:");
console.log("Effective gas price:", effectiveGasPrice1, "wei");
console.log("Calculation: min(15 + 2, 30) = 17 gwei");

const baseFee2 = 25_000_000_000n; // 25 gwei (medium congestion)
const effectiveGasPrice2 = Transaction.getGasPrice(eip1559, baseFee2);
console.log("\nBase fee 25 gwei:");
console.log("Effective gas price:", effectiveGasPrice2, "wei");
console.log("Calculation: min(25 + 2, 30) = 27 gwei");

const baseFee3 = 50_000_000_000n; // 50 gwei (high congestion)
const effectiveGasPrice3 = Transaction.getGasPrice(eip1559, baseFee3);
console.log("\nBase fee 50 gwei:");
console.log("Effective gas price:", effectiveGasPrice3, "wei");
console.log("Calculation: min(50 + 2, 30) = 30 gwei (capped at max)");
