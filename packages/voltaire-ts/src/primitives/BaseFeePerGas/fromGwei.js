/**
 * Create BaseFeePerGas from Gwei value
 *
 * @param {bigint | number} gwei - Value in Gwei
 * @returns {import("./BaseFeePerGasType.js").BaseFeePerGasType} Base fee in Wei
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.fromGwei(25n); // 25 Gwei = 25000000000 Wei
 * ```
 */
export function fromGwei(gwei) {
	const gweiValue = typeof gwei === "number" ? BigInt(gwei) : gwei;
	return /** @type {import("./BaseFeePerGasType.js").BaseFeePerGasType} */ (
		gweiValue * 1000000000n
	);
}
