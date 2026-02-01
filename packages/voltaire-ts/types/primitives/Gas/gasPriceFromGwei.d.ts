/**
 * Create GasPrice from gwei
 *
 * @param {number | bigint} gwei - Value in gwei
 * @returns {import('./GasPriceType.js').GasPriceType} Gas price in wei
 *
 * @example
 * ```typescript
 * const price = GasPrice.fromGwei(20); // 20 gwei = 20000000000 wei
 * ```
 */
export function gasPriceFromGwei(gwei: number | bigint): import("./GasPriceType.js").GasPriceType;
//# sourceMappingURL=gasPriceFromGwei.d.ts.map