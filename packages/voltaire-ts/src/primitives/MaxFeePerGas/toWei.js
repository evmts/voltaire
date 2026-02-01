/**
 * Convert MaxFeePerGas to Wei (identity function)
 *
 * @this {import("./MaxFeePerGasType.js").MaxFeePerGasType}
 * @returns {bigint} Value in Wei
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.from(100000000000n);
 * MaxFeePerGas.toWei(maxFee); // 100000000000n Wei
 * ```
 */
export function toWei() {
	return this;
}
