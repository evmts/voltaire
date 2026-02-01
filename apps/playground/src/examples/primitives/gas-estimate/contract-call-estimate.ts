import { GasEstimate } from "@tevm/voltaire";
// Example: Contract interaction gas estimation

// Common DeFi operations
const operations = {
	// Uniswap V2
	uniswapSwap: GasEstimate(150000n),
	uniswapAddLiquidity: GasEstimate(180000n),
	uniswapRemoveLiquidity: GasEstimate(120000n),

	// Uniswap V3 (more complex)
	uniswapV3Swap: GasEstimate(180000n),
	uniswapV3Mint: GasEstimate(250000n),

	// Other protocols
	aaveDeposit: GasEstimate(200000n),
	compoundSupply: GasEstimate(180000n),
	curveSwap: GasEstimate(160000n),
};
for (const [op, estimate] of Object.entries(operations)) {
}
const swapEstimate = GasEstimate(150000n);
const stakeEstimate = GasEstimate(120000n);
const totalEstimate = GasEstimate(
	GasEstimate.toBigInt(swapEstimate) + GasEstimate.toBigInt(stakeEstimate),
);

// Add buffer for complex transactions (30% recommended)
const buffered = GasEstimate.withBuffer(totalEstimate, 30);

// Convert to gas limit
const gasLimit = GasEstimate.toGasLimit(buffered);
const complexityLevels = [
	{
		name: "Simple (read-only)",
		estimate: GasEstimate(50000n),
		buffer: 10,
	},
	{
		name: "Medium (single write)",
		estimate: GasEstimate(80000n),
		buffer: 20,
	},
	{
		name: "Complex (multi-write)",
		estimate: GasEstimate(150000n),
		buffer: 25,
	},
	{
		name: "Very complex (DeFi)",
		estimate: GasEstimate(250000n),
		buffer: 30,
	},
];

for (const { name, estimate, buffer } of complexityLevels) {
	const withBuffer = GasEstimate.withBuffer(estimate, buffer);
}
const gasPrice = 50_000_000_000n;

const simple = GasEstimate.withBuffer(21000n, 20);
const medium = GasEstimate.withBuffer(150000n, 25);
const complex = GasEstimate.withBuffer(250000n, 30);
