import { from } from "./from.js";

/**
 * Create Uint128 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {number} value - Number value
 * @returns {import('./BrandedUint128.js').BrandedUint128} Uint128 value
 * @throws {Error} If value is not an integer or out of range
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.fromNumber(255);
 * ```
 */
export function fromNumber(value) {
	return from(value);
}
