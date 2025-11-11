/**
 * Calculate effective gas price given base fee.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedTransactionEIP4844.js').BrandedTransactionEIP4844} tx - EIP-4844 transaction
 * @param {bigint} baseFee - Base fee per gas
 * @returns {bigint} Effective gas price
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { getEffectiveGasPrice } from './primitives/Transaction/EIP4844/getEffectiveGasPrice.js';
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
