/**
 * Create GasUsed from number, bigint, or string
 *
 * @param {number | bigint | string} value - Gas used value
 * @returns {import('./GasUsedType.js').GasUsedType} Branded gas used
 * @throws {InvalidFormatError} If value is negative
 *
 * @example
 * ```typescript
 * const gasUsed = GasUsed.from(51234n);
 * const fromReceipt = GasUsed.from(receipt.gasUsed);
 * ```
 */
export function from(value: number | bigint | string): import("./GasUsedType.js").GasUsedType;
//# sourceMappingURL=from.d.ts.map