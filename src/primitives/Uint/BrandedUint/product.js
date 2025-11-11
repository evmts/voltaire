import { MAX } from "./constants.js";
import { ONE } from "./constants.js";

/**
 * Multiply multiple Uint256 values with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {...import('./BrandedUint.ts').BrandedUint} values - Values to multiply
 * @returns {import('./BrandedUint.ts').BrandedUint} Product of all values mod 2^256
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const result = Uint256.product(Uint256.from(10n), Uint256.from(5n), Uint256.from(2n)); // 100n
 * ```
 */
export function product(...values) {
	let result = ONE;
	for (const value of values) {
		result = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
			(result * value) & MAX
		);
	}
	return result;
}
