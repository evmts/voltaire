/**
 * Convert GasEstimate to GasLimit type
 * Typically used after adding buffer with withBuffer()
 *
 * @this {import('./GasEstimateType.js').GasEstimateType}
 * @returns {bigint} Gas limit value (unbranded bigint)
 *
 * @example
 * ```typescript
 * const estimate = GasEstimate.from(100000n);
 * const withBuffer = GasEstimate._withBuffer.call(estimate, 20);
 * const gasLimit = GasEstimate._toGasLimit.call(withBuffer); // 120000n
 * ```
 */
export function toGasLimit(this: import("./GasEstimateType.js").GasEstimateType): bigint;
//# sourceMappingURL=toGasLimit.d.ts.map