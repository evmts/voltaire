/**
 * Create BaseFeePerGas from Wei value (alias for from)
 *
 * @param {bigint | number | string} wei - Value in Wei
 * @returns {import("./BaseFeePerGasType.js").BaseFeePerGasType} Base fee
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.fromWei(25000000000n);
 * ```
 */
export function fromWei(wei) {
	return /** @type {import("./BaseFeePerGasType.js").BaseFeePerGasType} */ (wei);
}
