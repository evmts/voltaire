import { BaseFeePerGas } from "@tevm/voltaire";

// Example: Predicting base fees for transaction timing

// Users need to predict future base fees to set appropriate maxFeePerGas
// This example shows how to estimate future base fees based on trends

const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8n;
const GAS_TARGET = 15_000_000n;

function calculateNextBaseFee(currentBase: bigint, gasUsed: bigint): bigint {
	const delta =
		(currentBase * (gasUsed - GAS_TARGET)) /
		GAS_TARGET /
		BASE_FEE_MAX_CHANGE_DENOMINATOR;
	const nextBase = currentBase + delta;
	return nextBase < 0n ? 0n : nextBase;
}

function projectBaseFee(
	currentBase: bigint,
	avgGasUsed: bigint,
	blocks: number,
): bigint {
	let projectedBase = currentBase;
	for (let i = 0; i < blocks; i++) {
		projectedBase = calculateNextBaseFee(projectedBase, avgGasUsed);
	}
	return projectedBase;
}

// Current state
const currentBase = BaseFeePerGas.fromGwei(25n);
const highCongestionGas = 30_000_000n;

let projection = BaseFeePerGas.toBigInt(currentBase);
for (let i = 1; i <= 10; i++) {
	projection = calculateNextBaseFee(projection, highCongestionGas);
	if (i <= 5 || i === 10) {
	} else if (i === 6) {
	}
}

const recommendedMax = projection + (projection * 20n) / 100n; // +20% buffer
const stableGas = 15_000_000n;

projection = BaseFeePerGas.toBigInt(currentBase);
for (let i = 1; i <= 5; i++) {
	projection = calculateNextBaseFee(projection, stableGas);
}
const lowCongestionGas = 5_000_000n;

projection = BaseFeePerGas.toBigInt(currentBase);
for (let i = 1; i <= 10; i++) {
	projection = calculateNextBaseFee(projection, lowCongestionGas);
	if (i <= 5 || i === 10) {
	} else if (i === 6) {
	}
}

const blocksPerMinute = 5; // ~12 second blocks
const blocksPerHour = blocksPerMinute * 60;

const currentGwei = BaseFeePerGas.toGwei(currentBase);
