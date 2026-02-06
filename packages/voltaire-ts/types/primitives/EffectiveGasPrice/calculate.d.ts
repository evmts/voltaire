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
export function calculate(baseFee: bigint, maxFee: bigint, maxPriorityFee: bigint): import("./EffectiveGasPriceType.js").EffectiveGasPriceType;
//# sourceMappingURL=calculate.d.ts.map