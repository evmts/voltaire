/**
 * Convert MaxFeePerGas to Gwei
 *
 * @this {import("./MaxFeePerGasType.js").MaxFeePerGasType}
 * @returns {bigint} Value in Gwei
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.from(100000000000n);
 * MaxFeePerGas.toGwei(maxFee); // 100n Gwei
 * ```
 */
export function toGwei() {
	return this / 1000000000n;
}
