/**
 * Calculate effective gas price given base fee
 *
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @param {bigint} baseFee - Base fee per gas
 * @returns {bigint} Effective gas price
 *
 * @example
 * ```typescript
 * const price = getEffectiveGasPrice(tx, 1000000000n);
 * ```
 */
export function getEffectiveGasPrice(tx, baseFee) {
	const maxPriorityFee = tx.maxPriorityFeePerGas;
	const maxFee = tx.maxFeePerGas;
	const effectivePriorityFee =
		maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
	return baseFee + effectivePriorityFee;
}
