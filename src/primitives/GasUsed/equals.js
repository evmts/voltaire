/**
 * Check if two GasUsed values are equal
 *
 * @this {import('./GasUsedType.js').GasUsedType}
 * @param {import('./GasUsedType.js').GasUsedType} other - Other gas used value
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const a = GasUsed.from(51234n);
 * const b = GasUsed.from(51234n);
 * GasUsed._equals.call(a, b); // true
 * ```
 */
export function equals(other) {
	return this === other;
}
