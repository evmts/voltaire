import { ZERO } from "./constants.js";

/**
 * Calculate greatest common divisor using Euclidean algorithm
 *
 * @param {import('./BrandedUint.ts').BrandedUint} a - First value
 * @param {import('./BrandedUint.ts').BrandedUint} b - Second value
 * @returns {import('./BrandedUint.ts').BrandedUint} GCD of a and b
 *
 * @example
 * ```typescript
 * const result = Uint.gcd(Uint(48n), Uint(18n)); // 6
 * ```
 */
export function gcd(a, b) {
	let x = a;
	let y = b;
	while (y !== ZERO) {
		const temp = y;
		y = /** @type {import('./BrandedUint.ts').BrandedUint} */ (x % y);
		x = temp;
	}
	return x;
}
