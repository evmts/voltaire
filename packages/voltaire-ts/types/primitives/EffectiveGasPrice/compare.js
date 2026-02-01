/**
 * Compare two EffectiveGasPrice values
 *
 * @this {import("./EffectiveGasPriceType.js").EffectiveGasPriceType}
 * @param {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} other - Value to compare
 * @returns {number} -1 if this < other, 0 if equal, 1 if this > other
 *
 * @example
 * ```typescript
 * const price1 = EffectiveGasPrice.from(27000000000n);
 * const price2 = EffectiveGasPrice.from(30000000000n);
 * EffectiveGasPrice.compare(price1, price2); // -1
 * ```
 */
export function compare(other) {
    if (this < other)
        return -1;
    if (this > other)
        return 1;
    return 0;
}
