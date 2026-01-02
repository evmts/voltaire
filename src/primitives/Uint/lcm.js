import { MAX, ZERO } from "./constants.js";
import { gcd } from "./gcd.js";

/**
 * Calculate least common multiple
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./Uint256Type.js').Uint256Type} a - First value
 * @param {import('./Uint256Type.js').Uint256Type} b - Second value
 * @returns {import('./Uint256Type.js').Uint256Type} LCM of a and b
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
	return /** @type {import('./Uint256Type.js').Uint256Type} */ (
		((a * b) / gcd(a, b)) & MAX
	);
}
