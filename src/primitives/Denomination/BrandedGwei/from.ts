import * as Uint from "../../Uint/index.js";
import type { BrandedGwei } from "./BrandedGwei.js";

/**
 * Create Gwei from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param value - Value to convert (bigint, number, or string)
 * @returns Gwei amount
 * @throws {never}
 * @example
 * ```typescript
 * const gwei1 = Gwei.from(1000000000n);
 * const gwei2 = Gwei.from(1000000000);
 * const gwei3 = Gwei.from("1000000000");
 * const gwei4 = Gwei.from("0x3b9aca00");
 * ```
 */
export function from(value: bigint | number | string): BrandedGwei {
	return Uint.from(value) as BrandedGwei;
}
