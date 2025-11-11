import { MAX } from "./constants.js";
import { ZERO } from "./constants.js";

/**
 * Sum multiple Uint256 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {...import('./BrandedUint.ts').BrandedUint} values - Values to sum
 * @returns {import('./BrandedUint.ts').BrandedUint} Sum of all values mod 2^256
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const result = Uint256.sum(Uint256.from(100n), Uint256.from(50n), Uint256.from(25n)); // 175n
 * ```
 */
export function sum(...values) {
	let result = ZERO;
	for (const value of values) {
		result = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
			(result + value) & MAX
		);
	}
	return result;
}
