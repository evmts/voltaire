/**
 * Create EffectiveGasPrice from Wei value (alias for from)
 *
 * @param {bigint | number | string} wei - Value in Wei
 * @returns {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} Effective price
 *
 * @example
 * ```typescript
 * const effectivePrice = EffectiveGasPrice.fromWei(27000000000n);
 * ```
 */
export function fromWei(wei) {
	return /** @type {import("./EffectiveGasPriceType.js").EffectiveGasPriceType} */ (wei);
}
