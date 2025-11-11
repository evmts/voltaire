/**
 * Find maximum of multiple Uint256 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {...import('./BrandedUint.ts').BrandedUint} values - Values to compare
 * @returns {import('./BrandedUint.ts').BrandedUint} Maximum value
 * @throws {Error} If no values provided
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const result = Uint256.max(Uint256.from(100n), Uint256.from(50n), Uint256.from(75n)); // 100n
 * ```
 */
export function max(...values) {
	if (values.length === 0) {
		throw new Error("max requires at least one value");
	}
	let result = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
		values[0]
	);
	for (let i = 1; i < values.length; i++) {
		const val = /** @type {import('./BrandedUint.ts').BrandedUint} */ (
			values[i]
		);
		if (val > result) {
			result = val;
		}
	}
	return result;
}
