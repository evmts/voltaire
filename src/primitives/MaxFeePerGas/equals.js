/**
 * Check if two MaxFeePerGas values are equal
 *
 * @this {import("./MaxFeePerGasType.js").MaxFeePerGasType}
 * @param {import("./MaxFeePerGasType.js").MaxFeePerGasType} other - Value to compare
 * @returns {boolean} True if equal
 *
 * @example
 * ```typescript
 * const fee1 = MaxFeePerGas.from(100000000000n);
 * const fee2 = MaxFeePerGas.from(100000000000n);
 * MaxFeePerGas.equals(fee1, fee2); // true
 * ```
 */
export function equals(other) {
	return this === other;
}
