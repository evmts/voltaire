/**
 * Compare two BaseFeePerGas values
 *
 * @this {import("./BaseFeePerGasType.js").BaseFeePerGasType}
 * @param {import("./BaseFeePerGasType.js").BaseFeePerGasType} other - Value to compare
 * @returns {number} -1 if this < other, 0 if equal, 1 if this > other
 *
 * @example
 * ```typescript
 * const fee1 = BaseFeePerGas.from(25000000000n);
 * const fee2 = BaseFeePerGas.from(30000000000n);
 * BaseFeePerGas.compare(fee1, fee2); // -1
 * ```
 */
export function compare(other) {
	if (this < other) return -1;
	if (this > other) return 1;
	return 0;
}
