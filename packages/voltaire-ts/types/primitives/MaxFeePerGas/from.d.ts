/**
 * Create MaxFeePerGas from bigint, number, or hex string
 *
 * @param {bigint | number | string} value - Max fee in Wei
 * @returns {import("./MaxFeePerGasType.js").MaxFeePerGasType} Branded max fee
 * @throws {InvalidFormatError} If value is negative or invalid format
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.from(100000000000n); // 100 Gwei
 * const maxFee2 = MaxFeePerGas.from("0x174876e800");
 * ```
 */
export function from(value: bigint | number | string): import("./MaxFeePerGasType.js").MaxFeePerGasType;
//# sourceMappingURL=from.d.ts.map