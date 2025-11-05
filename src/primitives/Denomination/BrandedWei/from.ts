import * as Uint from "../../Uint/index.js";
import type { BrandedWei } from "./BrandedWei.js";

/**
 * Create Wei from bigint, number, or string
 *
 * @param value - Value to convert (bigint, number, or string)
 * @returns Wei amount
 *
 * @example
 * ```typescript
 * const wei1 = Wei.from(1000000000n);
 * const wei2 = Wei.from(1000000000);
 * const wei3 = Wei.from("1000000000");
 * const wei4 = Wei.from("0x3b9aca00");
 * ```
 */
export function from(value: bigint | number | string): BrandedWei {
	return Uint.from(value) as BrandedWei;
}
