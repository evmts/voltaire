import { bitLength } from "./bitLength.js";

/**
 * Get number of leading zero bits
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Value to check
 * @returns {number} Number of leading zeros (0-256)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(1n);
 * const zeros = Uint256.leadingZeros(a); // 255
 * ```
 */
export function leadingZeros(uint) {
	return 256 - bitLength(uint);
}
