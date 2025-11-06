import * as Uint from "../../Uint/index.js";
import type { BrandedGasPrice } from "./BrandedGasPrice.js";

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
export function toGwei(this: BrandedGasPrice): bigint {
	return Uint.toBigInt(this) / GWEI;
}
