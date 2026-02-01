/**
 * Convert EffectiveGasPrice to number
 * WARNING: May lose precision for large values
 *
 * @this {import("./EffectiveGasPriceType.js").EffectiveGasPriceType}
 * @returns {number} Value as number
 *
 * @example
 * ```typescript
 * const effectivePrice = EffectiveGasPrice.from(27000000000n);
 * EffectiveGasPrice.toNumber(effectivePrice); // 27000000000
 * ```
 */
export function toNumber(this: import("./EffectiveGasPriceType.js").EffectiveGasPriceType): number;
//# sourceMappingURL=toNumber.d.ts.map