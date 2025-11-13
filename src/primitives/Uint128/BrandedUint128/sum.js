import { plus } from "./plus.js";

/**
 * Sum array of values
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128[]} values - Array of values
 * @returns {import('./BrandedUint128.js').BrandedUint128} Sum with wrapping
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const values = [Uint128.from(100n), Uint128.from(50n), Uint128.from(75n)];
 * const total = Uint128.sum(values); // 225n
 * ```
 */
export function sum(values) {
	let result = 0n;
	for (let i = 0; i < values.length; i++) {
		result = plus(result, values[i]);
	}
	return result;
}
