/**
 * Check if two EffectiveGasPrice values are equal
 *
 * @this {import("./EffectiveGasPriceType.js").EffectiveGasPriceType}
 * @param {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} other - Value to compare
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const price1 = EffectiveGasPrice.from(27000000000n);
 * const price2 = EffectiveGasPrice.from(27000000000n);
 * EffectiveGasPrice.equals(price1, price2); // true
 * ```
 */
export function equals(other) {
    return this === other;
}
