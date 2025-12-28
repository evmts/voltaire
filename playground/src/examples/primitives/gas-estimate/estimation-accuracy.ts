import { GasEstimate } from "voltaire";
const scenarios = [
	{ name: "ETH transfer", estimate: 21000n, actual: 21000n },
	{ name: "ERC20 (cached)", estimate: 45000n, actual: 45000n },
	{ name: "ERC20 (cold)", estimate: 45000n, actual: 65000n },
	{ name: "Uniswap swap (low vol)", estimate: 150000n, actual: 152000n },
	{ name: "Uniswap swap (high vol)", estimate: 150000n, actual: 165000n },
	{ name: "Complex DeFi", estimate: 250000n, actual: 275000n },
];

for (const { name, estimate, actual } of scenarios) {
	const est = GasEstimate.from(estimate);
	const diff = Number(actual - estimate);
	const pctDiff = ((diff / Number(estimate)) * 100).toFixed(1);
	const safe = actual <= estimate;
}
const testEstimate = GasEstimate.from(100000n);

const accuracyLevels = [
	{ name: "High accuracy (±2%)", buffer: 10 },
	{ name: "Good accuracy (±5%)", buffer: 15 },
	{ name: "Medium accuracy (±10%)", buffer: 20 },
	{ name: "Low accuracy (±20%)", buffer: 30 },
	{ name: "Poor accuracy (±30%)", buffer: 40 },
];

for (const { name, buffer } of accuracyLevels) {
	const buffered = GasEstimate.withBuffer(testEstimate, buffer);
}
const rpcEstimate = GasEstimate.from(150000n);

// Check if estimate seems reasonable
const minExpected = 21000n;
const maxReasonable = 10_000_000n;
const estimate = GasEstimate.toBigInt(rpcEstimate);
const reasonable = estimate >= minExpected && estimate <= maxReasonable;

// Add appropriate buffer based on transaction type
const bufferPct = 25; // 25% for DeFi
const buffered = GasEstimate.withBuffer(rpcEstimate, bufferPct);

// Set gas limit
const gasLimit = GasEstimate.toGasLimit(buffered);

// Simulate execution
const actualUsed = 158000n; // Slightly more than estimate
const success = actualUsed <= gasLimit;
const gasPrice = 50_000_000_000n;
const exactCost = actualUsed * gasPrice;
const estimatedCost = gasLimit * gasPrice;
const refund = (gasLimit - actualUsed) * gasPrice;
