// @ts-nocheck

/**
 * Calculate effective transaction fee (standard form)
 *
 * Formula:
 * - effectiveGasPrice = min(maxFeePerGas, baseFee + maxPriorityFeePerGas)
 * - priorityFee = effectiveGasPrice - baseFee
 *
 * @param {import('./TxFeeParams.js').TxFeeParams} params - Transaction fee parameters
 * @returns {import('./TxFee.js').TxFee} Calculated fee breakdown
 *
 * @example
 * ```typescript
 * const fee = calculateTxFee({
 *   maxFeePerGas: 2_000_000_000n, // 2 gwei max
 *   maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei tip
 *   baseFee: 800_000_000n // 0.8 gwei base
 * });
 * // fee.effectiveGasPrice === 1_800_000_000n
 * // fee.priorityFee === 1_000_000_000n (full tip paid)
 * // fee.baseFee === 800_000_000n
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
