/**
 * Create MaxPriorityFeePerGas from bigint, number, or hex string
 *
 * @param {bigint | number | string} value - Priority fee in Wei
 * @returns {import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType} Branded priority fee
 * @throws {InvalidFormatError} If value is negative or invalid format
 *
 * @example
 * ```typescript
 * const priorityFee = MaxPriorityFeePerGas.from(2000000000n); // 2 Gwei
 * const priorityFee2 = MaxPriorityFeePerGas.from("0x77359400");
 * ```
 */
export function from(value: bigint | number | string): import("./MaxPriorityFeePerGasType.js").MaxPriorityFeePerGasType;
//# sourceMappingURL=from.d.ts.map