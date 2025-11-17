import * as Uint from "../Uint/index.js";

/**
 * Convert GasPrice to bigint
 *
 * @param this - Gas price
 * @returns BigInt in wei
 *
 * @example
 * ```typescript
 * const n = GasPrice._toBigInt.call(price);
 * ```
 */
export function gasPriceToBigInt() {
	return Uint.toBigInt(this);
}
