import * as GasEstimate from "../../../primitives/GasEstimate/index.js";

// Example: ETH transfer gas estimation

// Standard ETH transfer always uses 21000 gas (base transaction cost)
const baseTransfer = GasEstimate.from(21000n);
const with10Percent = GasEstimate.withBuffer(baseTransfer, 10);
const with20Percent = GasEstimate.withBuffer(baseTransfer, 20);
const with30Percent = GasEstimate.withBuffer(baseTransfer, 30);

// Recommended: 20% buffer for mainnet ETH transfers
const recommended = GasEstimate.withBuffer(baseTransfer, 20);
const gasEstimate = GasEstimate.toBigInt(recommended);

const gasPrices = [
	{ name: "Low (10 gwei)", wei: 10_000_000_000n },
	{ name: "Medium (50 gwei)", wei: 50_000_000_000n },
	{ name: "High (100 gwei)", wei: 100_000_000_000n },
	{ name: "Extreme (200 gwei)", wei: 200_000_000_000n },
];

for (const { name, wei } of gasPrices) {
	const cost = gasEstimate * wei;
	const ethCost = Number(cost) / 1e18;
}
