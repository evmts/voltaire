/**
 * Convert MaxPriorityFeePerGas to Wei (identity function)
 *
 * @this {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType}
 * @returns {bigint} Value in Wei
 *
 * @example
 * ```typescript
 * const priorityFee = MaxPriorityFeePerGas.from(2000000000n);
 * MaxPriorityFeePerGas.toWei(priorityFee); // 2000000000n Wei
 * ```
 */
export function toWei() {
    return this;
}
