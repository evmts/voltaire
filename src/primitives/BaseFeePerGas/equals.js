/**
 * Check if two BaseFeePerGas values are equal
 *
 * @this {import("./BaseFeePerGasType.js").BaseFeePerGasType}
 * @param {import("./BaseFeePerGasType.js").BaseFeePerGasType} other - Value to compare
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const fee1 = BaseFeePerGas.from(25000000000n);
 * const fee2 = BaseFeePerGas.from(25000000000n);
 * BaseFeePerGas.equals(fee1, fee2); // true
 * ```
 */
export function equals(other) {
	return this === other;
}
