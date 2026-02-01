/**
 * Compare two GasUsed values
 *
 * @this {import('./GasUsedType.js').GasUsedType}
 * @param {import('./GasUsedType.js').GasUsedType} other - Other gas used value
 * @returns {number} -1 if this < other, 0 if equal, 1 if this > other
 *
 * @example
 * ```typescript
 * const a = GasUsed.from(21000n);
 * const b = GasUsed.from(51234n);
 * GasUsed._compare.call(a, b); // -1
 * ```
 */
export function compare(other) {
    if (this < other)
        return -1;
    if (this > other)
        return 1;
    return 0;
}
