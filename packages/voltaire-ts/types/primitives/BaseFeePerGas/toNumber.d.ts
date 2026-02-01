/**
 * Convert BaseFeePerGas to number
 * WARNING: May lose precision for large values
 *
 * @this {import("./BaseFeePerGasType.js").BaseFeePerGasType}
 * @returns {number} Value as number
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.from(25000000000n);
 * BaseFeePerGas.toNumber(baseFee); // 25000000000
 * ```
 */
export function toNumber(this: import("./BaseFeePerGasType.js").BaseFeePerGasType): number;
//# sourceMappingURL=toNumber.d.ts.map