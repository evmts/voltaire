/**
 * Convert GasUsed to number
 *
 * @this {import('./GasUsedType.js').GasUsedType}
 * @returns {number} Gas used as number
 *
 * @example
 * ```typescript
 * const gasUsed = GasUsed.from(51234n);
 * GasUsed.toNumber(gasUsed); // 51234
 * ```
 */
export function toNumber() {
	return Number(this);
}
