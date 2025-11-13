import { dividedBy } from "./dividedBy.js";
import { gcd } from "./gcd.js";
import { times } from "./times.js";

/**
 * Calculate least common multiple
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - First operand
 * @param {import('./BrandedUint128.js').BrandedUint128} b - Second operand
 * @returns {import('./BrandedUint128.js').BrandedUint128} LCM of uint and b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(12n);
 * const b = Uint128.from(18n);
 * const result = Uint128.lcm(a, b); // 36n
 * ```
 */
export function lcm(uint, b) {
	if (uint === 0n || b === 0n) {
		return 0n;
	}

	const product = times(uint, b);
	const divisor = gcd(uint, b);
	return dividedBy(product, divisor);
}
