/**
 * Create MaxPriorityFeePerGas from Wei value (alias for from)
 *
 * @param {bigint | number | string} wei - Value in Wei
 * @returns {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} Priority fee
 *
 * @example
 * ```typescript
 * const priorityFee = MaxPriorityFeePerGas.fromWei(2000000000n);
 * ```
 */
export function fromWei(wei) {
    return /** @type {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} */ (wei);
}
