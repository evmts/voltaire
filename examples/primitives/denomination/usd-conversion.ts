/**
 * Example 5: USD Price Conversions
 *
 * Demonstrates:
 * - Converting Wei/Gwei/Ether to USD
 * - Price impact calculations
 * - Gas cost in fiat currency
 * - Budget planning and cost analysis
 */

import * as Ether from "../../../src/primitives/Denomination/Ether.js";
import * as Gwei from "../../../src/primitives/Denomination/Gwei.js";
import * as Wei from "../../../src/primitives/Denomination/Wei.js";
import * as Uint from "../../../src/primitives/Uint/index.js";

function weiToUSD(wei: Wei.Type, ethPriceUsd: number): number {
	const weiU256 = Wei.toU256(wei);
	const weiPerEther = Uint.from(1_000_000_000_000_000_000n);

	// Convert to Ether as decimal number
	const ether = Number(Uint.dividedBy(weiU256, weiPerEther));
	const fractionalWei = Number(Uint.modulo(weiU256, weiPerEther));
	const fractionalEther = fractionalWei / Number(weiPerEther);

	const totalEther = ether + fractionalEther;
	return totalEther * ethPriceUsd;
}

const ethPrice = 2000; // $2000 per ETH
const balances = [
	Wei.from(1_000_000_000_000_000_000n), // 1 ETH
	Wei.from(500_000_000_000_000_000n), // 0.5 ETH
	Wei.from(100_000_000_000_000_000n), // 0.1 ETH
	Wei.from(1_000_000_000_000_000n), // 0.001 ETH
];
for (const balance of balances) {
	const usd = weiToUSD(balance, ethPrice);
	const eth = Number(Wei.toU256(balance)) / 1e18;
}

function gasCostUSD(
	gasPriceGwei: Gwei.Type,
	gasUsed: bigint,
	ethPriceUsd: number,
): number {
	const gasPriceWei = Gwei.toWei(gasPriceGwei);
	const costWei = Uint.times(gasPriceWei, Uint.from(gasUsed));

	return weiToUSD(Wei.from(costWei), ethPriceUsd);
}

const operations = [
	{ name: "Transfer", gas: 21_000n },
	{ name: "ERC-20 Transfer", gas: 65_000n },
	{ name: "Uniswap Swap", gas: 150_000n },
	{ name: "NFT Mint", gas: 100_000n },
];

const gasPrices = [
	{ name: "Slow", gwei: 20n },
	{ name: "Standard", gwei: 50n },
	{ name: "Fast", gwei: 100n },
];

for (const op of operations) {
	for (const price of gasPrices) {
		const cost = gasCostUSD(Gwei.from(price.gwei), op.gas, ethPrice);
	}
}

function costAtDifferentPrices(
	wei: Wei.Type,
	ethPrices: number[],
): Map<number, number> {
	const costs = new Map<number, number>();

	for (const price of ethPrices) {
		costs.set(price, weiToUSD(wei, price));
	}

	return costs;
}

const txCost = Wei.from(1_050_000_000_000_000n); // 0.00105 ETH (21k @ 50 Gwei)
const ethPriceRange = [1000, 1500, 2000, 2500, 3000, 4000, 5000];
const costs = costAtDifferentPrices(txCost, ethPriceRange);

for (const [ethPrice, usdCost] of costs) {
}

interface MonthlyUsage {
	transfers: number;
	tokenTransfers: number;
	swaps: number;
}

function calculateMonthlyGasCost(
	usage: MonthlyUsage,
	avgGasPrice: Gwei.Type,
	ethPriceUsd: number,
): { total: number; breakdown: Record<string, number> } {
	const transferCost =
		gasCostUSD(avgGasPrice, 21_000n, ethPriceUsd) * usage.transfers;
	const tokenCost =
		gasCostUSD(avgGasPrice, 65_000n, ethPriceUsd) * usage.tokenTransfers;
	const swapCost = gasCostUSD(avgGasPrice, 150_000n, ethPriceUsd) * usage.swaps;

	return {
		total: transferCost + tokenCost + swapCost,
		breakdown: {
			transfers: transferCost,
			tokenTransfers: tokenCost,
			swaps: swapCost,
		},
	};
}

const monthlyUsage: MonthlyUsage = {
	transfers: 10, // 10 ETH transfers
	tokenTransfers: 20, // 20 token transfers
	swaps: 5, // 5 DEX swaps
};

const avgGasPrice = Gwei.from(50n);
const monthlyCost = calculateMonthlyGasCost(
	monthlyUsage,
	avgGasPrice,
	ethPrice,
);

function calculateROI(
	gasCostWei: Wei.Type,
	profitWei: Wei.Type,
	ethPriceUsd: number,
): {
	gasCostUsd: number;
	profitUsd: number;
	netProfitUsd: number;
	roi: number;
} {
	const gasCostUsd = weiToUSD(gasCostWei, ethPriceUsd);
	const profitUsd = weiToUSD(profitWei, ethPriceUsd);
	const netProfitUsd = profitUsd - gasCostUsd;
	const roi = gasCostUsd > 0 ? (netProfitUsd / gasCostUsd) * 100 : 0;

	return { gasCostUsd, profitUsd, netProfitUsd, roi };
}

const scenarios = [
	{
		name: "Arbitrage opportunity",
		gasPrice: 100n,
		gasUsed: 300_000n,
		profit: Wei.from(100_000_000_000_000_000n), // 0.1 ETH
	},
	{
		name: "Small trade",
		gasPrice: 50n,
		gasUsed: 150_000n,
		profit: Wei.from(10_000_000_000_000_000n), // 0.01 ETH
	},
];

for (const scenario of scenarios) {
	const gasPriceGwei = Gwei.from(scenario.gasPrice);
	const gasPriceWei = Gwei.toWei(gasPriceGwei);
	const gasCost = Wei.from(
		Uint.times(gasPriceWei, Uint.from(scenario.gasUsed)),
	);

	const analysis = calculateROI(gasCost, scenario.profit, ethPrice);
}

for (const price of gasPrices) {
	const transfer = gasCostUSD(Gwei.from(price.gwei), 21_000n, ethPrice);
	const token = gasCostUSD(Gwei.from(price.gwei), 65_000n, ethPrice);
	const swap = gasCostUSD(Gwei.from(price.gwei), 150_000n, ethPrice);
}
