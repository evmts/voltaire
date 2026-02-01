/**
 * Convert BaseFeePerGas to Gwei
 *
 * @this {import("./BaseFeePerGasType.js").BaseFeePerGasType}
 * @returns {bigint} Value in Gwei
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.from(25000000000n);
 * BaseFeePerGas.toGwei(baseFee); // 25n Gwei
 * ```
 */
export function toGwei() {
	return this / 1000000000n;
}
