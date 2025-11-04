import type { BrandedTransactionEIP1559 } from "./BrandedTransactionEIP1559.js";

/**
 * Calculate effective gas price given base fee
 */
export function getEffectiveGasPrice(
	tx: BrandedTransactionEIP1559,
	baseFee: bigint,
): bigint {
	const maxPriorityFee = tx.maxPriorityFeePerGas;
	const maxFee = tx.maxFeePerGas;
	const effectivePriorityFee =
		maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
	return baseFee + effectivePriorityFee;
}
