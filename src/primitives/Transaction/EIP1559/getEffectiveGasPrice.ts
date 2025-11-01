import type { EIP1559 } from "../types.js";

/**
 * Calculate effective gas price given base fee
 */
export function getEffectiveGasPrice(
	this: EIP1559,
	baseFee: bigint,
): bigint {
	const maxPriorityFee = this.maxPriorityFeePerGas;
	const maxFee = this.maxFeePerGas;
	const effectivePriorityFee =
		maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
	return baseFee + effectivePriorityFee;
}
