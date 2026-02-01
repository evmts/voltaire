/**
 * Convert GasUsed to bigint (identity, for compatibility)
 *
 * @this {import('./GasUsedType.js').GasUsedType}
 * @returns {bigint} Gas used as bigint
 *
 * @example
 * ```typescript
 * const gasUsed = GasUsed.from(51234n);
 * GasUsed.toBigInt(gasUsed); // 51234n
 * ```
 */
export function toBigInt() {
    return this;
}
