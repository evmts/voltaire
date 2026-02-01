/**
 * Calculate transaction cost in Wei (gasUsed * gasPrice)
 *
 * @this {import('./GasUsedType.js').GasUsedType}
 * @param {bigint} gasPrice - Gas price in Wei
 * @returns {bigint} Transaction cost in Wei
 *
 * @example
 * ```typescript
 * const gasUsed = GasUsed.from(51234n);
 * const gasPrice = 20_000_000_000n; // 20 gwei
 * GasUsed._calculateCost.call(gasUsed, gasPrice); // 1024680000000000n Wei
 * ```
 */
export function calculateCost(gasPrice) {
	return this * gasPrice;
}
