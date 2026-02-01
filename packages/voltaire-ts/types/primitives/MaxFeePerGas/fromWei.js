/**
 * Create MaxFeePerGas from Wei value (alias for from)
 *
 * @param {bigint | number | string} wei - Value in Wei
 * @returns {import("./MaxFeePerGasType.js").MaxFeePerGasType} Max fee
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.fromWei(100000000000n);
 * ```
 */
export function fromWei(wei) {
    return /** @type {import("./MaxFeePerGasType.js").MaxFeePerGasType} */ (wei);
}
