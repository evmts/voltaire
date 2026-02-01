/**
 * Convert MaxPriorityFeePerGas to number
 * WARNING: May lose precision for large values
 *
 * @this {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType}
 * @returns {number} Value as number
 *
 * @example
 * ```typescript
 * const priorityFee = MaxPriorityFeePerGas.from(2000000000n);
 * MaxPriorityFeePerGas.toNumber(priorityFee); // 2000000000
 * ```
 */
export function toNumber() {
	return Number(this);
}
