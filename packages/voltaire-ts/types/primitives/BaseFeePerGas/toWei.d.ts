/**
 * Convert BaseFeePerGas to Wei (identity function)
 *
 * @this {import("./BaseFeePerGasType.js").BaseFeePerGasType}
 * @returns {bigint} Value in Wei
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.from(25000000000n);
 * BaseFeePerGas.toWei(baseFee); // 25000000000n Wei
 * ```
 */
export function toWei(this: import("./BaseFeePerGasType.js").BaseFeePerGasType): bigint;
//# sourceMappingURL=toWei.d.ts.map