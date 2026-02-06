/**
 * Compare two GasEstimate values
 *
 * @this {import('./GasEstimateType.js').GasEstimateType}
 * @param {import('./GasEstimateType.js').GasEstimateType} other - Other gas estimate value
 * @returns {number} -1 if this < other, 0 if equal, 1 if this > other
 *
 * @example
 * ```typescript
 * const a = GasEstimate.from(21000n);
 * const b = GasEstimate.from(51234n);
 * GasEstimate._compare.call(a, b); // -1
 * ```
 */
export function compare(this: import("./GasEstimateType.js").GasEstimateType, other: import("./GasEstimateType.js").GasEstimateType): number;
//# sourceMappingURL=compare.d.ts.map