import { from } from "./from.js";
/**
 * Add percentage buffer to gas estimate
 * Recommended: 20-30% to account for variability
 *
 * @this {import('./GasEstimateType.js').GasEstimateType}
 * @param {number} percentageBuffer - Padding percentage (e.g., 20 for 20%)
 * @returns {import('./GasEstimateType.js').GasEstimateType} Estimate with buffer
 *
 * @example
 * ```typescript
 * const estimate = GasEstimate.from(100000n);
 * GasEstimate._withBuffer.call(estimate, 20); // 120000n (100000 + 20%)
 * GasEstimate._withBuffer.call(estimate, 30); // 130000n (100000 + 30%)
 * ```
 */
export function withBuffer(percentageBuffer) {
    if (percentageBuffer < 0) {
        throw new Error(`Padding percentage must be non-negative, got ${percentageBuffer}`);
    }
    const buffer = (this * BigInt(Math.floor(percentageBuffer * 100))) / 10000n;
    return from(this + buffer);
}
