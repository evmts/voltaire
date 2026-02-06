/**
 * Convert GasEstimate to bigint (identity, for compatibility)
 *
 * @this {import('./GasEstimateType.js').GasEstimateType}
 * @returns {bigint} Gas estimate as bigint
 *
 * @example
 * ```typescript
 * const estimate = GasEstimate.from(51234n);
 * GasEstimate.toBigInt(estimate); // 51234n
 * ```
 */
export function toBigInt() {
	return this;
}
