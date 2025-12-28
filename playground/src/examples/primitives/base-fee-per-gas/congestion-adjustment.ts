import { BaseFeePerGas } from "@tevm/voltaire";

// Example: Base fee adjusts based on network congestion

// The base fee mechanism creates a negative feedback loop:
// - High usage -> base fee increases -> less demand
// - Low usage -> base fee decreases -> more demand

const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8n;
const GAS_TARGET = 15_000_000n;

function simulateBlocks(
	initialBaseFee: bigint,
	gasUsedPattern: bigint[],
): void {
	let currentBase = initialBaseFee;

	for (let i = 0; i < gasUsedPattern.length; i++) {
		const gasUsed = gasUsedPattern[i];
		const utilizationPercent = Number((gasUsed * 100n) / (GAS_TARGET * 2n));

		// Calculate next base fee
		const delta =
			(currentBase * (gasUsed - GAS_TARGET)) /
			GAS_TARGET /
			BASE_FEE_MAX_CHANGE_DENOMINATOR;
		const nextBase = currentBase + delta;
		currentBase = nextBase < 0n ? 0n : nextBase;

		const changePercent =
			Number(((nextBase - (currentBase - delta)) * 10000n) / currentBase) / 100;
	}
}
const nftDropPattern = [
	30_000_000n, // Full blocks during drop
	30_000_000n,
	30_000_000n,
	30_000_000n,
	30_000_000n,
	22_500_000n, // Demand cooling
	15_000_000n, // Back to normal
	10_000_000n,
];
simulateBlocks(BaseFeePerGas.fromGwei(20n), nftDropPattern);
const panicPattern = [
	15_000_000n, // Normal
	30_000_000n, // Panic starts
	30_000_000n, // Peak panic
	30_000_000n,
	20_000_000n, // Recovery
	15_000_000n, // Back to normal
	10_000_000n, // Below target
];
simulateBlocks(BaseFeePerGas.fromGwei(25n), panicPattern);
const weekendPattern = [
	15_000_000n, // Friday
	12_000_000n, // Saturday starts
	8_000_000n, // Sunday low
	5_000_000n, // Sunday night
	3_000_000n, // Very quiet
	8_000_000n, // Monday pickup
	15_000_000n, // Back to normal
];
simulateBlocks(BaseFeePerGas.fromGwei(30n), weekendPattern);
const stablePattern = [
	15_000_000n, // At target
	16_000_000n, // Slightly over
	14_500_000n, // Slightly under
	15_500_000n, // Slightly over
	14_800_000n, // Slightly under
];
simulateBlocks(BaseFeePerGas.fromGwei(20n), stablePattern);
