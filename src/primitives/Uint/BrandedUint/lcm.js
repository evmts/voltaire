import { ZERO } from "./constants.js";
import { MAX } from "./constants.js";
import { gcd } from "./gcd.js";

/**
 * Calculate least common multiple
 *
 * @param {import('./BrandedUint.ts').BrandedUint} a - First value
 * @param {import('./BrandedUint.ts').BrandedUint} b - Second value
 * @returns {import('./BrandedUint.ts').BrandedUint} LCM of a and b
 *
 * @example
 * ```typescript
 * const result = Uint.lcm(Uint(12n), Uint(18n)); // 36
 * ```
 */
export function lcm(a, b) {
	if (a === ZERO || b === ZERO) {
		return ZERO;
	}
	return /** @type {import('./BrandedUint.ts').BrandedUint} */ (
		((a * b) / gcd(a, b)) & MAX
	);
}
