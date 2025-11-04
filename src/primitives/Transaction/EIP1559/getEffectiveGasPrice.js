/**
 * Calculate effective gas price given base fee
 *
 * @param {import('./BrandedTransactionEIP1559.js').BrandedTransactionEIP1559} tx - Transaction
 * @param {bigint} baseFee - Block base fee
 * @returns {bigint} Effective gas price
 *
 * @example
 * ```typescript
 * const effectivePrice = getEffectiveGasPrice(tx, 20n);
 * ```
 */
export function getEffectiveGasPrice(tx, baseFee) {
	const maxPriorityFee = tx.maxPriorityFeePerGas;
	const maxFee = tx.maxFeePerGas;
	const effectivePriorityFee =
		maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
	return baseFee + effectivePriorityFee;
}
