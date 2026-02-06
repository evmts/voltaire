/**
 * Compare two MaxFeePerGas values
 *
 * @this {import("./MaxFeePerGasType.js").MaxFeePerGasType}
 * @param {import("./MaxFeePerGasType.js").MaxFeePerGasType} other - Value to compare
 * @returns {number} -1 if this < other, 0 if equal, 1 if this > other
 *
 * @example
 * ```typescript
 * const fee1 = MaxFeePerGas.from(100000000000n);
 * const fee2 = MaxFeePerGas.from(120000000000n);
 * MaxFeePerGas.compare(fee1, fee2); // -1
 * ```
 */
export function compare(this: import("./MaxFeePerGasType.js").MaxFeePerGasType, other: import("./MaxFeePerGasType.js").MaxFeePerGasType): number;
//# sourceMappingURL=compare.d.ts.map