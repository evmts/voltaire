/**
 * Create MaxFeePerGas from Gwei value
 *
 * @param {bigint | number} gwei - Value in Gwei
 * @returns {import("./MaxFeePerGasType.js").MaxFeePerGasType} Max fee in Wei
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.fromGwei(100n); // 100 Gwei = 100000000000 Wei
 * ```
 */
export function fromGwei(gwei) {
	const gweiValue = typeof gwei === "number" ? BigInt(gwei) : gwei;
	return /** @type {import("./MaxFeePerGasType.js").MaxFeePerGasType} */ (
		gweiValue * 1000000000n
	);
}
