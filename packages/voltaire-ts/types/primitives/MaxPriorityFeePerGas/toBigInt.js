/**
 * Convert MaxPriorityFeePerGas to bigint (identity function)
 *
 * @this {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType}
 * @returns {bigint} Value as bigint
 *
 * @example
 * ```typescript
 * const priorityFee = MaxPriorityFeePerGas.from(2000000000n);
 * MaxPriorityFeePerGas.toBigInt(priorityFee); // 2000000000n
 * ```
 */
export function toBigInt() {
    return this;
}
