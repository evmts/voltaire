/**
 * Create MaxPriorityFeePerGas from Gwei value
 *
 * @param {bigint | number} gwei - Value in Gwei
 * @returns {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} Priority fee in Wei
 *
 * @example
 * ```typescript
 * const priorityFee = MaxPriorityFeePerGas.fromGwei(2n); // 2 Gwei = 2000000000 Wei
 * ```
 */
export function fromGwei(gwei: bigint | number): import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType;
//# sourceMappingURL=fromGwei.d.ts.map