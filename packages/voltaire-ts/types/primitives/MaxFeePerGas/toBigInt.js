/**
 * Convert MaxFeePerGas to bigint (identity function)
 *
 * @this {import("./MaxFeePerGasType.js").MaxFeePerGasType}
 * @returns {bigint} Value as bigint
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.from(100000000000n);
 * MaxFeePerGas.toBigInt(maxFee); // 100000000000n
 * ```
 */
export function toBigInt() {
    return this;
}
