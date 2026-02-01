/**
 * Convert EffectiveGasPrice to Wei (identity function)
 *
 * @this {import("./EffectiveGasPriceType.js").EffectiveGasPriceType}
 * @returns {bigint} Value in Wei
 *
 * @example
 * ```typescript
 * const effectivePrice = EffectiveGasPrice.from(27000000000n);
 * EffectiveGasPrice.toWei(effectivePrice); // 27000000000n Wei
 * ```
 */
export function toWei(this: import("./EffectiveGasPriceType.js").EffectiveGasPriceType): bigint;
//# sourceMappingURL=toWei.d.ts.map