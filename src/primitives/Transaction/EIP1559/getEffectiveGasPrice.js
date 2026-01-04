/**
 * Calculate effective gas price given base fee.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./TransactionEIP1559Type.js').BrandedTransactionEIP1559} tx - Transaction
 * @param {bigint} baseFee - Block base fee
 * @returns {bigint} Effective gas price
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getEffectiveGasPrice } from './primitives/Transaction/EIP1559/getEffectiveGasPrice.js';
 * const effectivePrice = getEffectiveGasPrice(tx, 20n);
 * ```
 */
export function getEffectiveGasPrice(tx, baseFee) {
	const maxPriorityFee = tx.maxPriorityFeePerGas;
	const maxFee = tx.maxFeePerGas;
	// effectivePriorityFee = min(maxPriorityFee, maxFee - baseFee)
	// Clamp to 0n to prevent negative values when baseFee > maxFee or invalid inputs
	const unclamped =
		maxFee - baseFee < maxPriorityFee ? maxFee - baseFee : maxPriorityFee;
	const effectivePriorityFee = unclamped < 0n ? 0n : unclamped;
	return baseFee + effectivePriorityFee;
}
