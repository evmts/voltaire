import { ZERO } from "./constants.js";
import { MAX } from "./constants.js";
import { gcd } from "./gcd.js";

/**
 * Calculate least common multiple
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.ts').BrandedUint} a - First value
 * @param {import('./BrandedUint.ts').BrandedUint} b - Second value
 * @returns {import('./BrandedUint.ts').BrandedUint} LCM of a and b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const result = Uint256.lcm(Uint256.from(12n), Uint256.from(18n)); // 36n
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
