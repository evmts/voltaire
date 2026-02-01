/**
 * Check if two GasEstimate values are equal
 *
 * @this {import('./GasEstimateType.js').GasEstimateType}
 * @param {import('./GasEstimateType.js').GasEstimateType} other - Other gas estimate value
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const a = GasEstimate.from(51234n);
 * const b = GasEstimate.from(51234n);
 * GasEstimate._equals.call(a, b); // true
 * ```
 */
export function equals(other) {
    return this === other;
}
