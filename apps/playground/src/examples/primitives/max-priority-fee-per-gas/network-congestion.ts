import { MaxPriorityFeePerGas } from "@tevm/voltaire";

const congestionLevels = {
	veryLow: {
		baseFee: 10n,
		recommendedTip: MaxPriorityFeePerGas(500000000n), // 0.5 Gwei
	},
	low: {
		baseFee: 20n,
		recommendedTip: MaxPriorityFeePerGas.fromGwei(1),
	},
	medium: {
		baseFee: 30n,
		recommendedTip: MaxPriorityFeePerGas.fromGwei(2),
	},
	high: {
		baseFee: 50n,
		recommendedTip: MaxPriorityFeePerGas.fromGwei(5),
	},
	veryHigh: {
		baseFee: 100n,
		recommendedTip: MaxPriorityFeePerGas.fromGwei(10),
	},
	extreme: {
		baseFee: 200n,
		recommendedTip: MaxPriorityFeePerGas.fromGwei(20),
	},
};

for (const [level, { baseFee, recommendedTip }] of Object.entries(
	congestionLevels,
)) {
	const tip = MaxPriorityFeePerGas.toGwei(recommendedTip);
}

function calculateRecommendedTip(baseFeeGwei: bigint): bigint {
	// Simple heuristic: tip = 5-10% of base fee, min 1 Gwei
	const tipGwei = (baseFeeGwei * 5n) / 100n;
	return MaxPriorityFeePerGas.fromGwei(tipGwei < 1n ? 1n : tipGwei);
}

const baseFeeSamples = [10n, 30n, 50n, 100n, 200n];
for (const baseFee of baseFeeSamples) {
	const tip = calculateRecommendedTip(baseFee);
}
const historicalTips = [
	{ block: 18000000, tip: MaxPriorityFeePerGas.fromGwei(2) },
	{ block: 18100000, tip: MaxPriorityFeePerGas.fromGwei(3) },
	{ block: 18200000, tip: MaxPriorityFeePerGas(1500000000n) }, // 1.5 Gwei
	{ block: 18300000, tip: MaxPriorityFeePerGas.fromGwei(5) },
	{ block: 18400000, tip: MaxPriorityFeePerGas.fromGwei(2) },
];
for (const { block, tip } of historicalTips) {
}

// Calculate average
const avgTip =
	historicalTips.reduce(
		(sum, { tip }) => sum + MaxPriorityFeePerGas.toBigInt(tip),
		0n,
	) / BigInt(historicalTips.length);
const recentTips = [
	MaxPriorityFeePerGas.fromGwei(1),
	MaxPriorityFeePerGas.fromGwei(2),
	MaxPriorityFeePerGas.fromGwei(2),
	MaxPriorityFeePerGas.fromGwei(3),
	MaxPriorityFeePerGas.fromGwei(5),
	MaxPriorityFeePerGas.fromGwei(8),
	MaxPriorityFeePerGas.fromGwei(10),
];

const sorted = [...recentTips].sort((a, b) =>
	MaxPriorityFeePerGas.compare(a, b),
);

const p50 = sorted[Math.floor(sorted.length * 0.5)];
const p75 = sorted[Math.floor(sorted.length * 0.75)];
const p90 = sorted[Math.floor(sorted.length * 0.9)];
