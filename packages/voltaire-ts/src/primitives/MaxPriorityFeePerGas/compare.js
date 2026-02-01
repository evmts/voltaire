/**
 * Compare two MaxPriorityFeePerGas values
 *
 * @this {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType}
 * @param {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} other - Value to compare
 * @returns {number} -1 if this < other, 0 if equal, 1 if this > other
 *
 * @example
 * ```typescript
 * const fee1 = MaxPriorityFeePerGas.from(2000000000n);
 * const fee2 = MaxPriorityFeePerGas.from(5000000000n);
 * MaxPriorityFeePerGas.compare(fee1, fee2); // -1
 * ```
 */
export function compare(other) {
	if (this < other) return -1;
	if (this > other) return 1;
	return 0;
}
