/**
 * Convert GasEstimate to number
 *
 * @this {import('./GasEstimateType.js').GasEstimateType}
 * @returns {number} Gas estimate as number
 *
 * @example
 * ```typescript
 * const estimate = GasEstimate.from(51234n);
 * GasEstimate.toNumber(estimate); // 51234
 * ```
 */
export function toNumber() {
    return Number(this);
}
