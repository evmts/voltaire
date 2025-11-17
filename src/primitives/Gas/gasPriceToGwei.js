import * as Uint from "../Uint/index.js";

const GWEI = 1_000_000_000n;

/**
 * Convert GasPrice to gwei
 *
 * @param this - Gas price
 * @returns Value in gwei
 *
 * @example
 * ```typescript
 * const gwei = GasPrice._toGwei.call(price);
 * ```
 */
export function gasPriceToGwei() {
	return Uint.toBigInt(this) / GWEI;
}
