/**
 * Convert MaxFeePerGas to number
 * WARNING: May lose precision for large values
 *
 * @this {import("./MaxFeePerGasType.js").MaxFeePerGasType}
 * @returns {number} Value as number
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.from(100000000000n);
 * MaxFeePerGas.toNumber(maxFee); // 100000000000
 * ```
 */
export function toNumber() {
    return Number(this);
}
