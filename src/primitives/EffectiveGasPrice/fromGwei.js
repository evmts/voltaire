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
export function fromGwei(gwei) {
	const gweiValue = typeof gwei === "number" ? BigInt(gwei) : gwei;
	return gweiValue * 1000000000n;
}
