/**
 * Create EffectiveGasPrice from bigint, number, or hex string
 *
 * @param {bigint | number | string} value - Effective price in Wei
 * @returns {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} Branded effective gas price
 * @throws {InvalidFormatError} If value is negative or invalid format
 *
 * @example
 * ```typescript
 * const effectivePrice = EffectiveGasPrice.from(27000000000n); // 27 Gwei
 * const effectivePrice2 = EffectiveGasPrice.from("0x64da46800");
 * ```
 */
export function from(value: bigint | number | string): import("./EffectiveGasPriceType.js").EffectiveGasPriceType;
//# sourceMappingURL=from.d.ts.map