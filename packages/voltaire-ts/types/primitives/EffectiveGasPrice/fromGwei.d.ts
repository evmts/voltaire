/**
 * Create EffectiveGasPrice from Gwei value
 *
 * @param {bigint | number} gwei - Value in Gwei
 * @returns {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} Effective price in Wei
 *
 * @example
 * ```typescript
 * const effectivePrice = EffectiveGasPrice.fromGwei(27n); // 27 Gwei = 27000000000 Wei
 * ```
 */
export function fromGwei(gwei: bigint | number): import("./EffectiveGasPriceType.js").EffectiveGasPriceType;
//# sourceMappingURL=fromGwei.d.ts.map