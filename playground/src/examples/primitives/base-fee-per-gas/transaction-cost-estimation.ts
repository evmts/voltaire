import * as BaseFeePerGas from "../../../primitives/BaseFeePerGas/index.js";

// Gas costs for common operations
const GAS_TRANSFER = 21000n; // Simple ETH transfer
const GAS_ERC20_TRANSFER = 65000n; // ERC-20 transfer
const GAS_UNISWAP_SWAP = 150000n; // Uniswap V2 swap
const GAS_NFT_MINT = 100000n; // NFT mint
const GAS_COMPLEX_DEFI = 300000n; // Complex DeFi interaction

function calculateCost(
	baseFeeGwei: bigint,
	priorityFeeGwei: bigint,
	gasUsed: bigint,
): { wei: bigint; gwei: bigint; eth: number } {
	const baseFeeWei = baseFeeGwei * 1000000000n;
	const priorityFeeWei = priorityFeeGwei * 1000000000n;
	const totalFeeWei = baseFeeWei + priorityFeeWei;

	const costWei = totalFeeWei * gasUsed;
	const costGwei = costWei / 1000000000n;
	const costEth = Number(costWei) / 1e18;

	return { wei: costWei, gwei: costGwei, eth: costEth };
}
const lowBase = BaseFeePerGas.fromGwei(15n);
const lowPriority = 1n; // gwei

const operations = [
	{ name: "ETH transfer", gas: GAS_TRANSFER },
	{ name: "ERC-20 transfer", gas: GAS_ERC20_TRANSFER },
	{ name: "Uniswap swap", gas: GAS_UNISWAP_SWAP },
	{ name: "NFT mint", gas: GAS_NFT_MINT },
	{ name: "Complex DeFi", gas: GAS_COMPLEX_DEFI },
];

operations.forEach(({ name, gas }) => {
	const cost = calculateCost(BaseFeePerGas.toGwei(lowBase), lowPriority, gas);
});
const mediumBase = BaseFeePerGas.fromGwei(30n);
const mediumPriority = 2n;

operations.forEach(({ name, gas }) => {
	const cost = calculateCost(
		BaseFeePerGas.toGwei(mediumBase),
		mediumPriority,
		gas,
	);
});
const highBase = BaseFeePerGas.fromGwei(100n);
const highPriority = 5n;

operations.forEach(({ name, gas }) => {
	const cost = calculateCost(BaseFeePerGas.toGwei(highBase), highPriority, gas);
});
const congestionLevels = [
	{ name: "Low (15 gwei)", base: 15n, priority: 1n },
	{ name: "Medium (30 gwei)", base: 30n, priority: 2n },
	{ name: "High (50 gwei)", base: 50n, priority: 3n },
	{ name: "Very High (100 gwei)", base: 100n, priority: 5n },
	{ name: "Extreme (500 gwei)", base: 500n, priority: 10n },
];

congestionLevels.forEach(({ name, base, priority }) => {
	const cost = calculateCost(base, priority, GAS_UNISWAP_SWAP);
});
const breakdown = calculateCost(30n, 2n, GAS_UNISWAP_SWAP);
const burnedCost = calculateCost(30n, 0n, GAS_UNISWAP_SWAP);
const tipCost = calculateCost(0n, 2n, GAS_UNISWAP_SWAP);
const dailySwaps = 10n;

congestionLevels.forEach(({ name, base, priority }) => {
	const swapCost = calculateCost(base, priority, GAS_UNISWAP_SWAP);
	const dailyCost = swapCost.eth * Number(dailySwaps);
	const monthlyCost = dailyCost * 30;
});
