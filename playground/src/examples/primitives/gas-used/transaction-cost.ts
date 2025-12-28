import { GasUsed } from "voltaire";
const gasUsed = GasUsed.from(51234n);

// Different gas price scenarios
const gasPrices = [
	{ label: "Very Low", gwei: 10, wei: 10_000_000_000n },
	{ label: "Low", gwei: 20, wei: 20_000_000_000n },
	{ label: "Average", gwei: 30, wei: 30_000_000_000n },
	{ label: "High", gwei: 50, wei: 50_000_000_000n },
	{ label: "Very High", gwei: 100, wei: 100_000_000_000n },
	{ label: "Extreme", gwei: 500, wei: 500_000_000_000n },
];
for (const price of gasPrices) {
	const cost = GasUsed.calculateCost(gasUsed, price.wei);
	const costInEth = Number(cost) / 1e18;
}
const lowCost = GasUsed.calculateCost(gasUsed, gasPrices[0].wei);
const highCost = GasUsed.calculateCost(gasUsed, gasPrices[4].wei);
const extremeCost = GasUsed.calculateCost(gasUsed, gasPrices[5].wei);
