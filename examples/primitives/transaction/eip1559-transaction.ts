/**
 * EIP-1559 Transaction Example
 *
 * Demonstrates EIP-1559 (Type 2) transactions with:
 * - Dynamic fee market mechanics
 * - Base fee + priority fee
 * - Access lists for gas optimization
 * - Effective gas price calculation
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hash from "../../../src/primitives/Hash/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

// Example 1: Basic EIP-1559 transaction
const basicTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip
	maxFeePerGas: 30_000_000_000n, // 30 gwei max
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n, // 1 ETH
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: Hex.toBytes(
		"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
	),
	s: Hex.toBytes(
		"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
	),
};

const scenarios = [
	{ baseFee: 15_000_000_000n, description: "Normal block" },
	{ baseFee: 25_000_000_000n, description: "Busy block" },
	{ baseFee: 28_000_000_000n, description: "Very busy (near max)" },
	{ baseFee: 30_000_000_000n, description: "At max fee" },
];

for (const scenario of scenarios) {
	const effectiveGasPrice = Transaction.EIP1559.getEffectiveGasPrice(
		basicTx,
		scenario.baseFee,
	);
	const actualPriority = effectiveGasPrice - scenario.baseFee;
}

// Example 3: Transaction with access list
const accessListTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 5n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 50_000n,
	to: Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F"), // DAI
	value: 0n,
	data: Hex.toBytes(`0xa9059cbb${"00".repeat(64)}`), // transfer() call
	accessList: [
		{
			address: Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
			storageKeys: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				),
			],
		},
		{
			address: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
			storageKeys: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000003",
				),
			],
		},
	],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};
for (let i = 0; i < accessListTx.accessList.length; i++) {
	const item = accessListTx.accessList[i];
}

const currentBaseFee = 15_000_000_000n; // 15 gwei

// Conservative (cheaper, slower)
const conservative: Transaction.EIP1559 = {
	...basicTx,
	maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei tip
	maxFeePerGas: currentBaseFee + 5_000_000_000n, // base + 5 gwei buffer
};

// Standard (balanced)
const standard: Transaction.EIP1559 = {
	...basicTx,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip
	maxFeePerGas: currentBaseFee * 2n, // 2x base fee
};

// Aggressive (faster, more expensive)
const aggressive: Transaction.EIP1559 = {
	...basicTx,
	maxPriorityFeePerGas: 5_000_000_000n, // 5 gwei tip
	maxFeePerGas: currentBaseFee * 3n, // 3x base fee
};
const baseFee = 15_000_000_000n;
const gasUsed = 21000n;
const effectiveGasPrice = Transaction.EIP1559.getEffectiveGasPrice(
	basicTx,
	baseFee,
);

const maxPossibleCost = basicTx.maxFeePerGas * basicTx.gasLimit + basicTx.value;
const actualCost = effectiveGasPrice * gasUsed + basicTx.value;
const refund = (basicTx.maxFeePerGas - effectiveGasPrice) * gasUsed;

// Example 7: Contract deployment with EIP-1559
const deployment: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 500_000n, // High for deployment
	to: null, // null = contract creation
	value: 0n,
	data: Hex.toBytes("0x608060405234801561001057600080fd5b50"), // Bytecode
	accessList: [],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};
