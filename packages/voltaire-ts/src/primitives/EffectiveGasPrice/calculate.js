/**
 * Calculate effective gas price from EIP-1559 fee parameters
 * Formula: min(baseFee + min(maxPriorityFee, maxFee - baseFee), maxFee)
 *
 * @param {bigint} baseFee - Base fee per gas
 * @param {bigint} maxFee - Maximum fee per gas
 * @param {bigint} maxPriorityFee - Maximum priority fee per gas
 * @returns {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} Effective gas price
 *
 * @example
 * ```typescript
 * const baseFee = 25000000000n; // 25 Gwei
 * const maxFee = 100000000000n; // 100 Gwei
 * const maxPriorityFee = 2000000000n; // 2 Gwei
 * const effective = EffectiveGasPrice.calculate(baseFee, maxFee, maxPriorityFee);
 * // Returns 27000000000n (25 + 2 Gwei)
 * ```
 */
export function calculate(baseFee, maxFee, maxPriorityFee) {
	// Effective priority fee = min(maxPriorityFee, maxFee - baseFee)
	const maxAllowedPriorityFee = maxFee - baseFee;
	const effectivePriorityFee =
		maxPriorityFee < maxAllowedPriorityFee
			? maxPriorityFee
			: maxAllowedPriorityFee;

	// Effective gas price = baseFee + effectivePriorityFee
	const effectiveGasPrice = baseFee + effectivePriorityFee;

	// Should always be <= maxFee, but cap it for safety
	return /** @type {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} */ (
		effectiveGasPrice <= maxFee ? effectiveGasPrice : maxFee
	);
}
