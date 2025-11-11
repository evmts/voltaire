import * as Uint from "../../Uint/index.js";
import type { BrandedWei } from "./BrandedWei.js";

/**
 * Create Wei from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param value - Value to convert (bigint, number, or string)
 * @returns Wei amount
 * @throws {never}
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
