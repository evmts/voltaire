import * as Uint from "../Uint/index.js";

/**
 * Convert GasPrice to bigint
 *
 * @this {import('./GasPriceType.js').GasPriceType}
 * @returns {bigint} BigInt in wei
 *
 * @example
 * ```typescript
 * const n = GasPrice._toBigInt.call(price);
 * ```
 */
export function gasPriceToBigInt() {
	return Uint.toBigInt(/** @type {*} */ (this));
}
