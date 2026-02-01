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
export function compare(this: import("./GasUsedType.js").GasUsedType, other: import("./GasUsedType.js").GasUsedType): number;
//# sourceMappingURL=compare.d.ts.map