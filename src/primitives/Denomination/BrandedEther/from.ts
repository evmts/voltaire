import * as Uint from "../../Uint/index.js";
import type { BrandedEther } from "./BrandedEther.js";

/**
 * Create Ether from bigint, number, or string
 *
 * @param value - Value to convert (bigint, number, or string)
 * @returns Ether amount
 *
 * @example
 * ```typescript
 * const ether1 = Ether.from(1000000000000000000n);
 * const ether2 = Ether.from(1000000000000000000);
 * const ether3 = Ether.from("1000000000000000000");
 * const ether4 = Ether.from("0xde0b6b3a7640000");
 * ```
 */
export function from(value: bigint | number | string): BrandedEther {
	return Uint.from(value) as BrandedEther;
}
