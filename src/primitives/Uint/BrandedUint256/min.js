/**
 * Find minimum of multiple Uint256 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {...import('./BrandedUint.ts').BrandedUint} values - Values to compare
 * @returns {import('./BrandedUint.ts').BrandedUint} Minimum value
 * @throws {Error} If no values provided
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const result = Uint256.min(Uint256.from(100n), Uint256.from(50n), Uint256.from(75n)); // 50n
 * ```
 */
export function min(...values) {
	if (values.length === 0) {
		throw new Error("min requires at least one value");
	}
	let result = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
		values[0]
	);
	for (let i = 1; i < values.length; i++) {
		const val = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
			values[i]
		);
		if (val < result) {
			result = val;
		}
	}
	return result;
}
