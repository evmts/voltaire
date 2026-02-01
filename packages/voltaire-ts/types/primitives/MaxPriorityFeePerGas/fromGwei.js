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
export function fromGwei(gwei) {
    const gweiValue = typeof gwei === "number" ? BigInt(gwei) : gwei;
    return /** @type {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} */ (gweiValue * 1000000000n);
}
