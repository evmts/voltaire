import * as Uint from "../../Uint/index.js";
import type { BrandedGasLimit } from "./BrandedGasLimit.js";

/**
 * Create GasLimit from number, bigint, or hex string
 *
 * @param value - Value to convert
 * @returns Gas limit
 *
 * @example
 * ```typescript
 * const limit1 = GasLimit.from(21000);
 * const limit2 = GasLimit.from(21000n);
 * const limit3 = GasLimit.from("0x5208");
 * ```
 */
export function from(value: number | bigint | string): BrandedGasLimit {
	return Uint.from(value) as BrandedGasLimit;
}
