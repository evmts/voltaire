/**
 * Convert GasEstimate to hex string
 *
 * @this {import('./GasEstimateType.js').GasEstimateType}
 * @returns {string} Gas estimate as hex string (0x prefixed)
 *
 * @example
 * ```typescript
 * const estimate = GasEstimate.from(51234n);
 * GasEstimate.toHex(estimate); // "0xc822"
 * ```
 */
export function toHex() {
    return `0x${this.toString(16)}`;
}
