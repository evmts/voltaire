import type { Type } from "./Uint.js";
import { MAX } from "./constants.js";

/**
 * Exponentiation
 *
 * @param this - Base value
 * @param exponent - Exponent value
 * @returns this^exponent mod 2^256
 *
 * @example
 * ```typescript
 * const base = Uint.from(2);
 * const result = Uint.toPower.call(base, Uint.from(8)); // 256
 * ```
 */
export function toPower(this: Type, exponent: Type): Type {
	let result = 1n;
	let b = this as bigint;
	let e = exponent as bigint;

	while (e > 0n) {
		if (e & 1n) {
			result = (result * b) & (MAX as bigint);
		}
		b = (b * b) & (MAX as bigint);
		e = e >> 1n;
	}

	return result as Type;
}
