import { bitLength } from "./bitLength.js";

/**
 * Get number of leading zero bits
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Value to check
 * @returns {number} Number of leading zeros (0-128)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(1n);
 * const zeros = Uint128.leadingZeros(a); // 127
 * ```
 */
export function leadingZeros(uint) {
	return 128 - bitLength(uint);
}
