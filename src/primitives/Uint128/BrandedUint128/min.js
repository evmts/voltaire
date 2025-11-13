import { minimum } from "./minimum.js";

/**
 * Get minimum value from array
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128[]} values - Array of values
 * @returns {import('./BrandedUint128.js').BrandedUint128} Minimum value
 * @throws {Error} If array is empty
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const values = [Uint128.from(100n), Uint128.from(50n), Uint128.from(75n)];
 * const min = Uint128.min(values); // 50n
 * ```
 */
export function min(values) {
	if (values.length === 0) {
		throw new Error("Cannot find minimum of empty array");
	}

	let result = values[0];
	for (let i = 1; i < values.length; i++) {
		result = minimum(result, values[i]);
	}
	return result;
}
