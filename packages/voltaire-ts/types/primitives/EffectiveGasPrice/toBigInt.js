/**
 * Convert EffectiveGasPrice to bigint (identity function)
 *
 * @this {import("./EffectiveGasPriceType.js").EffectiveGasPriceType}
 * @returns {bigint} Value as bigint
 *
 * @example
 * ```typescript
 * const effectivePrice = EffectiveGasPrice.from(27000000000n);
 * EffectiveGasPrice.toBigInt(effectivePrice); // 27000000000n
 * ```
 */
export function toBigInt() {
    return this;
}
