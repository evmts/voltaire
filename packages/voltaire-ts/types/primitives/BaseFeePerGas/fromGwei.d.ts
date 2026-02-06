/**
 * Create BaseFeePerGas from Gwei value
 *
 * @param {bigint | number} gwei - Value in Gwei
 * @returns {import("./BaseFeePerGasType.js").BaseFeePerGasType} Base fee in Wei
 *
 * @example
 * ```typescript
 * const baseFee = BaseFeePerGas.fromGwei(25n); // 25 Gwei = 25000000000 Wei
 * ```
 */
export function fromGwei(gwei: bigint | number): import("./BaseFeePerGasType.js").BaseFeePerGasType;
//# sourceMappingURL=fromGwei.d.ts.map