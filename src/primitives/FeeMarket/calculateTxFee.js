// @ts-nocheck

/**
 * Calculate effective transaction fee (standard form)
 *
 * Formula:
 * - effectiveGasPrice = min(maxFeePerGas, baseFee + maxPriorityFeePerGas)
 * - priorityFee = effectiveGasPrice - baseFee
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {import('../TxFeeParams.js').TxFeeParams} params - Transaction fee parameters
 * @returns {import('../TxFee.js').TxFee} Calculated fee breakdown
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const fee = FeeMarket.calculateTxFee({
 *   maxFeePerGas: 2_000_000_000n,
 *   maxPriorityFeePerGas: 1_000_000_000n,
 *   baseFee: 800_000_000n
 * });
 * ```
 */
export function calculateTxFee(params) {
	const { maxFeePerGas, maxPriorityFeePerGas, baseFee } = params;

	// Effective gas price is capped by maxFeePerGas
	const effectiveGasPrice =
		baseFee + maxPriorityFeePerGas < maxFeePerGas
			? baseFee + maxPriorityFeePerGas
			: maxFeePerGas;

	// Priority fee is what remains after base fee
	const priorityFee =
		effectiveGasPrice > baseFee ? effectiveGasPrice - baseFee : 0n;

	return {
		effectiveGasPrice,
		priorityFee,
		baseFee,
	};
}
