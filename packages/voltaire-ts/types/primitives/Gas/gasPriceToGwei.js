import * as Uint from "../Uint/index.js";
const GWEI = 1000000000n;
/**
 * Convert GasPrice to gwei
 *
 * @this {import('./GasPriceType.js').GasPriceType}
 * @returns {bigint} Value in gwei
 *
 * @example
 * ```typescript
 * const gwei = GasPrice._toGwei.call(price);
 * ```
 */
export function gasPriceToGwei() {
    return Uint.toBigInt(/** @type {*} */ (this)) / GWEI;
}
