import { MAX } from "./constants.js";
import { ZERO } from "./constants.js";

/**
 * Sum multiple Uint256 values with wrapping
 *
 * @param {...import('./BrandedUint.ts').BrandedUint} values - Values to sum
 * @returns {import('./BrandedUint.ts').BrandedUint} Sum of all values mod 2^256
 *
 * @example
 * ```typescript
 * const result = Uint.sum(Uint(100n), Uint(50n), Uint(25n)); // 175
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
