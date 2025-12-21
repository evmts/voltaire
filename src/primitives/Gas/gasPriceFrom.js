import * as Uint from "../Uint/index.js";

/**
 * Create GasPrice from number, bigint, or hex string
 *
 * @param {bigint | number | string} value - Value in wei
 * @returns {import('./GasPriceType.js').GasPriceType} Gas price
 *
 * @example
 * ```typescript
 * const price1 = GasPrice.from(20_000_000_000); // 20 gwei
 * const price2 = GasPrice.from(20_000_000_000n);
 * const price3 = GasPrice.from("0x4a817c800");
 * ```
 */
export function gasPriceFrom(value) {
	return /** @type {import('./GasPriceType.js').GasPriceType} */ (/** @type {unknown} */ (
		Uint.from(value)
	));
}
