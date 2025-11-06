import * as Uint from "../../Uint/index.js";
import type { BrandedGasPrice } from "./BrandedGasPrice.js";

/**
 * Create GasPrice from number, bigint, or hex string
 *
 * @param value - Value in wei
 * @returns Gas price
 *
 * @example
 * ```typescript
 * const price1 = GasPrice.from(20_000_000_000); // 20 gwei
 * const price2 = GasPrice.from(20_000_000_000n);
 * const price3 = GasPrice.from("0x4a817c800");
 * ```
 */
export function from(value: number | bigint | string): BrandedGasPrice {
	return Uint.from(value) as BrandedGasPrice;
}
