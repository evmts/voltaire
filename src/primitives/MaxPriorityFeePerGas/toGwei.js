/**
 * Convert MaxPriorityFeePerGas to Gwei
 *
 * @this {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType}
 * @returns {bigint} Value in Gwei
 *
 * @example
 * ```typescript
 * const priorityFee = MaxPriorityFeePerGas.from(2000000000n);
 * MaxPriorityFeePerGas.toGwei(priorityFee); // 2n Gwei
 * ```
 */
export function toGwei() {
	return this / 1000000000n;
}
