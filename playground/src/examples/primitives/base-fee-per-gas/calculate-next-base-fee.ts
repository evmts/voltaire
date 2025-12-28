import { BaseFeePerGas } from "@tevm/voltaire";

// Example: Calculate next block's base fee using EIP-1559 formula

// EIP-1559 formula:
// base_fee_delta = current_base_fee * (gas_used - gas_target) / gas_target / BASE_FEE_MAX_CHANGE_DENOMINATOR
// next_base_fee = current_base_fee + base_fee_delta
// BASE_FEE_MAX_CHANGE_DENOMINATOR = 8 (12.5% max change)

const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8n;
const GAS_LIMIT = 30_000_000n; // 30M gas limit per block
const GAS_TARGET = GAS_LIMIT / 2n; // Target is 50% of limit (15M)

function calculateNextBaseFee(currentBaseFee: bigint, gasUsed: bigint): bigint {
	const gasTarget = GAS_TARGET;
	const delta =
		(currentBaseFee * (gasUsed - gasTarget)) /
		gasTarget /
		BASE_FEE_MAX_CHANGE_DENOMINATOR;
	const nextBaseFee = currentBaseFee + delta;

	// Base fee cannot go below 0
	return nextBaseFee < 0n ? 0n : nextBaseFee;
}

const currentBase = BaseFeePerGas.fromGwei(100n);
const fullBlockGas = 30_000_000n;
const nextBaseFull = calculateNextBaseFee(
	BaseFeePerGas.toBigInt(currentBase),
	fullBlockGas,
);
const increasePercent =
	Number(((nextBaseFull - currentBase) * 10000n) / currentBase) / 100;
const targetGas = 15_000_000n;
const nextBaseTarget = calculateNextBaseFee(
	BaseFeePerGas.toBigInt(currentBase),
	targetGas,
);
const emptyBlockGas = 0n;
const nextBaseEmpty = calculateNextBaseFee(
	BaseFeePerGas.toBigInt(currentBase),
	emptyBlockGas,
);
const decreasePercent =
	Number(((nextBaseEmpty - currentBase) * 10000n) / currentBase) / 100;
const partialGas = 22_500_000n;
const nextBasePartial = calculateNextBaseFee(
	BaseFeePerGas.toBigInt(currentBase),
	partialGas,
);
const partialPercent =
	Number(((nextBasePartial - currentBase) * 10000n) / currentBase) / 100;
let projectedBase = BaseFeePerGas.toBigInt(currentBase);
for (let i = 1; i <= 10; i++) {
	projectedBase = calculateNextBaseFee(projectedBase, fullBlockGas);
}
