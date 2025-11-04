import type { BrandedTransactionEIP4844 } from "./BrandedTransactionEIP4844.js";

/**
 * Calculate effective gas price given base fee
 */
export function getEffectiveGasPrice(
	tx: BrandedTransactionEIP4844,
	baseFee: bigint,
): bigint {
	const maxPriorityFee = tx.maxPriorityFeePerGas;
	const maxFee = tx.maxFeePerGas;
	const effectivePriorityFee =
		maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
	return baseFee + effectivePriorityFee;
}
