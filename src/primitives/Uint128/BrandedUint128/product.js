import { times } from "./times.js";

/**
 * Product of array of values
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128[]} values - Array of values
 * @returns {import('./BrandedUint128.js').BrandedUint128} Product with wrapping
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const values = [Uint128.from(10n), Uint128.from(5n), Uint128.from(2n)];
 * const total = Uint128.product(values); // 100n
 * ```
 */
export function product(values) {
	if (values.length === 0) {
		return 1n;
	}

	let result = values[0];
	for (let i = 1; i < values.length; i++) {
		result = times(result, values[i]);
	}
	return result;
}
