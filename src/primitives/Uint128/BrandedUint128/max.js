import { maximum } from "./maximum.js";

/**
 * Get maximum value from array
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128[]} values - Array of values
 * @returns {import('./BrandedUint128.js').BrandedUint128} Maximum value
 * @throws {Error} If array is empty
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const values = [Uint128.from(100n), Uint128.from(50n), Uint128.from(75n)];
 * const max = Uint128.max(values); // 100n
 * ```
 */
export function max(values) {
	if (values.length === 0) {
		throw new Error("Cannot find maximum of empty array");
	}

	let result = values[0];
	for (let i = 1; i < values.length; i++) {
		result = maximum(result, values[i]);
	}
	return result;
}
