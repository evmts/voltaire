/**
 * Create MaxFeePerGas from Gwei value
 *
 * @param {bigint | number} gwei - Value in Gwei
 * @returns {import("./MaxFeePerGasType.js").MaxFeePerGasType} Max fee in Wei
 *
 * @example
 * ```typescript
 * const maxFee = MaxFeePerGas.fromGwei(100n); // 100 Gwei = 100000000000 Wei
 * ```
 */
export function fromGwei(gwei: bigint | number): import("./MaxFeePerGasType.js").MaxFeePerGasType;
//# sourceMappingURL=fromGwei.d.ts.map