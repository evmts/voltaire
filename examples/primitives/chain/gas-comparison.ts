/**
 * Chain Example 5: Gas Cost Comparison
 *
 * Demonstrates:
 * - Comparing transaction costs across networks
 * - Estimating fees for different operations
 * - Cost-based network selection
 * - Real-world cost calculations
 */

import { Chain } from "../../../src/primitives/Chain/Chain.js";

console.log("\n=== Gas Cost Comparison Example ===\n");

// Gas price estimates (in Gwei)
const GAS_PRICES: Record<number, bigint> = {
	1: 50n, // Ethereum mainnet
	10: 1n, // Optimism
	42161: 1n, // Arbitrum
	8453: 1n, // Base
	137: 30n, // Polygon
	11155111: 1n, // Sepolia (testnet)
};

// Operation gas costs
const GAS_COSTS = {
	transfer: 21_000n, // Simple ETH transfer
	erc20Transfer: 65_000n, // ERC20 token transfer
	swap: 150_000n, // Uniswap-style swap
	nftMint: 100_000n, // NFT mint
	complexContract: 300_000n, // Complex contract interaction
};

console.log("1. Transfer Cost Comparison (21,000 gas)");
console.log("   --------------------------------------");

function calculateCost(chainId: number, gasAmount: bigint): bigint {
	const gasPriceGwei = GAS_PRICES[chainId] ?? 1n;
	const gasPriceWei = gasPriceGwei * 1_000_000_000n; // Gwei to Wei
	return gasPriceWei * gasAmount;
}

function formatCost(weiAmount: bigint, ethPrice: number = 2000): string {
	const ethAmount = Number(weiAmount) / 1e18;
	const usdAmount = ethAmount * ethPrice;
	return `${ethAmount.toFixed(6)} ETH ($${usdAmount.toFixed(2)})`;
}

const transferChains = [1, 10, 42161, 8453, 137];
transferChains.forEach((id) => {
	const chain = Chain.fromId(id);
	if (!chain) return;

	const cost = calculateCost(id, GAS_COSTS.transfer);
	const formatted = formatCost(cost);

	console.log(`   ${chain.name.padEnd(25)} ${formatted}`);
});

console.log();

// ERC20 transfer comparison
console.log("2. ERC20 Transfer Cost (65,000 gas)");
console.log("   ---------------------------------");

transferChains.forEach((id) => {
	const chain = Chain.fromId(id);
	if (!chain) return;

	const cost = calculateCost(id, GAS_COSTS.erc20Transfer);
	const formatted = formatCost(cost);

	console.log(`   ${chain.name.padEnd(25)} ${formatted}`);
});

console.log();

// Swap cost comparison
console.log("3. DEX Swap Cost (150,000 gas)");
console.log("   ----------------------------");

transferChains.forEach((id) => {
	const chain = Chain.fromId(id);
	if (!chain) return;

	const cost = calculateCost(id, GAS_COSTS.swap);
	const formatted = formatCost(cost);

	console.log(`   ${chain.name.padEnd(25)} ${formatted}`);
});

console.log();

// Multi-operation cost analysis
console.log("4. Multi-Operation Cost Analysis");
console.log("   -----------------------------");

interface CostBreakdown {
	chainId: number;
	chainName: string;
	operations: {
		transfer: string;
		erc20: string;
		swap: string;
		nftMint: string;
	};
	total: string;
}

function analyzeCosts(chainId: number): CostBreakdown | null {
	const chain = Chain.fromId(chainId);
	if (!chain) return null;

	const costs = {
		transfer: calculateCost(chainId, GAS_COSTS.transfer),
		erc20: calculateCost(chainId, GAS_COSTS.erc20Transfer),
		swap: calculateCost(chainId, GAS_COSTS.swap),
		nftMint: calculateCost(chainId, GAS_COSTS.nftMint),
	};

	const total = costs.transfer + costs.erc20 + costs.swap + costs.nftMint;

	return {
		chainId: chain.chainId,
		chainName: chain.name,
		operations: {
			transfer: formatCost(costs.transfer),
			erc20: formatCost(costs.erc20),
			swap: formatCost(costs.swap),
			nftMint: formatCost(costs.nftMint),
		},
		total: formatCost(total),
	};
}

const mainnetAnalysis = analyzeCosts(1);
if (mainnetAnalysis) {
	console.log(`   ${mainnetAnalysis.chainName}:`);
	console.log(`     Transfer:   ${mainnetAnalysis.operations.transfer}`);
	console.log(`     ERC20:      ${mainnetAnalysis.operations.erc20}`);
	console.log(`     Swap:       ${mainnetAnalysis.operations.swap}`);
	console.log(`     NFT Mint:   ${mainnetAnalysis.operations.nftMint}`);
	console.log(`     Total:      ${mainnetAnalysis.total}\n`);
}

const arbitrumAnalysis = analyzeCosts(42161);
if (arbitrumAnalysis) {
	console.log(`   ${arbitrumAnalysis.chainName}:`);
	console.log(`     Transfer:   ${arbitrumAnalysis.operations.transfer}`);
	console.log(`     ERC20:      ${arbitrumAnalysis.operations.erc20}`);
	console.log(`     Swap:       ${arbitrumAnalysis.operations.swap}`);
	console.log(`     NFT Mint:   ${arbitrumAnalysis.operations.nftMint}`);
	console.log(`     Total:      ${arbitrumAnalysis.total}\n`);
}

// Cost-based network recommendation
console.log("5. Network Recommendation Engine");
console.log("   -----------------------------");

interface NetworkRecommendation {
	chainId: number;
	name: string;
	estimatedCost: string;
	reason: string;
}

function recommendNetwork(
	operationType: keyof typeof GAS_COSTS,
	maxBudgetUsd: number,
): NetworkRecommendation[] {
	const ethPrice = 2000;
	const recommendations: NetworkRecommendation[] = [];

	transferChains.forEach((id) => {
		const chain = Chain.fromId(id);
		if (!chain) return;

		const gasAmount = GAS_COSTS[operationType];
		const cost = calculateCost(id, gasAmount);
		const costUsd = (Number(cost) / 1e18) * ethPrice;

		if (costUsd <= maxBudgetUsd) {
			let reason = "Within budget";
			if (id === 1) {
				reason = "Maximum security, high cost";
			} else if (id === 10 || id === 42161 || id === 8453) {
				reason = "L2 rollup, low cost";
			} else if (id === 137) {
				reason = "Sidechain, moderate cost";
			}

			recommendations.push({
				chainId: id,
				name: chain.name,
				estimatedCost: formatCost(cost, ethPrice),
				reason,
			});
		}
	});

	return recommendations.sort((a, b) => {
		const costA = Number(calculateCost(a.chainId, GAS_COSTS[operationType]));
		const costB = Number(calculateCost(b.chainId, GAS_COSTS[operationType]));
		return costA - costB;
	});
}

const swapRecs = recommendNetwork("swap", 5.0);
console.log("   Recommended for swap (budget: $5):\n");
swapRecs.forEach((rec, i) => {
	console.log(`   ${i + 1}. ${rec.name}`);
	console.log(`      Cost: ${rec.estimatedCost}`);
	console.log(`      Reason: ${rec.reason}\n`);
});

// Savings calculator
console.log("6. L2 Savings Calculator");
console.log("   ---------------------");

function calculateSavings(
	l1ChainId: number,
	l2ChainId: number,
	gasAmount: bigint,
): { savings: string; percentage: number } | null {
	const l1Cost = calculateCost(l1ChainId, gasAmount);
	const l2Cost = calculateCost(l2ChainId, gasAmount);

	if (l1Cost === 0n) return null;

	const savingsWei = l1Cost - l2Cost;
	const percentage = (Number(savingsWei) / Number(l1Cost)) * 100;

	return {
		savings: formatCost(savingsWei),
		percentage,
	};
}

const operations: Array<[string, bigint]> = [
	["Transfer", GAS_COSTS.transfer],
	["ERC20 Transfer", GAS_COSTS.erc20Transfer],
	["Swap", GAS_COSTS.swap],
	["NFT Mint", GAS_COSTS.nftMint],
];

console.log("   Ethereum vs Arbitrum:\n");
operations.forEach(([name, gas]) => {
	const savings = calculateSavings(1, 42161, gas);
	if (savings) {
		console.log(`   ${name}:`);
		console.log(`     Savings: ${savings.savings}`);
		console.log(`     Percentage: ${savings.percentage.toFixed(1)}% cheaper\n`);
	}
});

// Monthly cost projection
console.log("7. Monthly Cost Projection");
console.log("   -----------------------");

interface MonthlyUsage {
	transfers: number;
	erc20Transfers: number;
	swaps: number;
	nftMints: number;
}

function projectMonthlyCost(
	chainId: number,
	usage: MonthlyUsage,
): string | null {
	const chain = Chain.fromId(chainId);
	if (!chain) return null;

	const totalCost =
		calculateCost(chainId, GAS_COSTS.transfer) * BigInt(usage.transfers) +
		calculateCost(chainId, GAS_COSTS.erc20Transfer) *
			BigInt(usage.erc20Transfers) +
		calculateCost(chainId, GAS_COSTS.swap) * BigInt(usage.swaps) +
		calculateCost(chainId, GAS_COSTS.nftMint) * BigInt(usage.nftMints);

	return formatCost(totalCost);
}

const heavyUsage: MonthlyUsage = {
	transfers: 30, // Daily transfers
	erc20Transfers: 20,
	swaps: 10,
	nftMints: 5,
};

console.log(
	"   Heavy user (30 transfers, 20 ERC20, 10 swaps, 5 NFTs/month):\n",
);
[1, 10, 42161].forEach((id) => {
	const chain = Chain.fromId(id);
	const cost = projectMonthlyCost(id, heavyUsage);
	if (chain && cost) {
		console.log(`   ${chain.name.padEnd(25)} ${cost}`);
	}
});

console.log("\n=== Example Complete ===\n");
