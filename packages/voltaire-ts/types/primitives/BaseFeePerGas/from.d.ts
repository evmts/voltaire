/**
 * Create BaseFeePerGas from bigint, number, or hex string
 *
 * @param {bigint | number | string} value - Base fee in Wei
 * @returns {import("./BaseFeePerGasType.js").BaseFeePerGasType} Branded base fee
 * @throws {InvalidFormatError} If value is negative or invalid format
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.from(25000000000n); // 25 Gwei
 * const baseFee2 = BaseFeePerGas.from("0x5d21dba00");
 * ```
 */
export function from(value: bigint | number | string): import("./BaseFeePerGasType.js").BaseFeePerGasType;
//# sourceMappingURL=from.d.ts.map