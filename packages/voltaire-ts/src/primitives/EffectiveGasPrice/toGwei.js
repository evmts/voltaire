/**
 * Convert EffectiveGasPrice to Gwei
 *
 * @this {import("./EffectiveGasPriceType.js").EffectiveGasPriceType}
 * @returns {bigint} Value in Gwei
 *
 * @example
 * ```typescript
 * const effectivePrice = EffectiveGasPrice.from(27000000000n);
 * EffectiveGasPrice.toGwei(effectivePrice); // 27n Gwei
 * ```
 */
export function toGwei() {
	return this / 1000000000n;
}
