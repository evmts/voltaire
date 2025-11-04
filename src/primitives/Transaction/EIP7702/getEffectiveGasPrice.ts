import type { BrandedTransactionEIP7702 } from "./BrandedTransactionEIP7702.js";

/**
 * Calculate effective gas price given base fee
 */
export function getEffectiveGasPrice(
	tx: BrandedTransactionEIP7702,
	baseFee: bigint,
): bigint {
	const maxPriorityFee = tx.maxPriorityFeePerGas;
	const maxFee = tx.maxFeePerGas;
	const effectivePriorityFee =
		maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
	return baseFee + effectivePriorityFee;
}
