/**
 * Create GasEstimate from number, bigint, or string
 *
 * @param {number | bigint | string} value - Gas estimate value
 * @returns {import('./GasEstimateType.js').GasEstimateType} Branded gas estimate
 * @throws {InvalidFormatError} If value is negative
 *
 * @example
 * ```typescript
 * const estimate = GasEstimate.from(51234n);
 * const fromRpc = GasEstimate.from(rpcEstimate);
 * ```
 */
export function from(value: number | bigint | string): import("./GasEstimateType.js").GasEstimateType;
//# sourceMappingURL=from.d.ts.map