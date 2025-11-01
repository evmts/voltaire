import type { Type } from "./Uint.js";
import { bitLength } from "./bitLength.js";

/**
 * Get number of leading zero bits
 *
 * @param this - Value to check
 * @returns Number of leading zeros (0-256)
 *
 * @example
 * ```typescript
 * const a = Uint.from(1);
 * const zeros = Uint.leadingZeros.call(a); // 255
 * ```
 */
export function leadingZeros(this: Type): number {
	return 256 - bitLength.call(this);
}
