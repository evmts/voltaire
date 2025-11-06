import { MAX } from "./constants.js";
import { ONE } from "./constants.js";

/**
 * Multiply multiple Uint256 values with wrapping
 *
 * @param {...import('./BrandedUint.ts').BrandedUint} values - Values to multiply
 * @returns {import('./BrandedUint.ts').BrandedUint} Product of all values mod 2^256
 *
 * @example
 * ```typescript
 * const result = Uint.product(Uint(10n), Uint(5n), Uint(2n)); // 100
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
