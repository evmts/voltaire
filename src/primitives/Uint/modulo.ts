import type { Type } from "./Uint.js";

/**
 * Modulo operation
 *
 * @param this - Dividend
 * @param b - Divisor
 * @returns Remainder (this % b)
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint.from(100);
 * const remainder = Uint.modulo.call(a, Uint.from(30)); // 10
 * ```
 */
export function modulo(this: Type, b: Type): Type {
	if ((b as bigint) === 0n) {
		throw new Error("Modulo by zero");
	}
	return ((this as bigint) % (b as bigint)) as Type;
}
