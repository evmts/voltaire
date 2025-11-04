import type { BrandedUint } from "./BrandedUint.js";

/**
 * Modulo operation
 *
 * @param uint - Dividend
 * @param b - Divisor
 * @returns Remainder (uint % b)
 * @throws Error if divisor is zero
 *
 * @example
 * ```typescript
 * const a = Uint(100n);
 * const b = Uint(30n);
 * const remainder1 = Uint.modulo(a, b); // 10
 * const remainder2 = a.modulo(b); // 10
 * ```
 */
export function modulo(uint: BrandedUint, b: BrandedUint): BrandedUint {
	if ((b as bigint) === 0n) {
		throw new Error("Modulo by zero");
	}
	return ((uint as bigint) % (b as bigint)) as BrandedUint;
}
