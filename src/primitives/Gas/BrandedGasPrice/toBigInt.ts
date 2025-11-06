import * as Uint from "../../Uint/index.js";
import type { BrandedGasPrice } from "./BrandedGasPrice.js";

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
export function toBigInt(this: BrandedGasPrice): bigint {
	return Uint.toBigInt(this);
}
