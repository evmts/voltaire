/**
 * Convert BaseFeePerGas to bigint (identity function)
 *
 * @this {import("./BaseFeePerGasType.js").BaseFeePerGasType}
 * @returns {bigint} Value as bigint
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.from(25000000000n);
 * BaseFeePerGas.toBigInt(baseFee); // 25000000000n
 * ```
 */
export function toBigInt() {
	return this;
}
