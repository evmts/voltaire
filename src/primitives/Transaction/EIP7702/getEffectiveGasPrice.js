/**
 * Calculate effective gas price given base fee
 *
 * @param {import('./BrandedTransactionEIP7702.js').BrandedTransactionEIP7702} tx - Transaction
 * @param {bigint} baseFee - Current block base fee
 * @returns {bigint} Effective gas price
 *
 * @example
 * ```javascript
 * const effectivePrice = TransactionEIP7702.getEffectiveGasPrice(tx, 30n);
 * // Returns effective gas price considering base fee
 * ```
 */
export function getEffectiveGasPrice(tx, baseFee) {
	const maxPriorityFee = tx.maxPriorityFeePerGas;
	const maxFee = tx.maxFeePerGas;
	const effectivePriorityFee =
		maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
	return baseFee + effectivePriorityFee;
}
