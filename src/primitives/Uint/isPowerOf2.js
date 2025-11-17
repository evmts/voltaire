import { ZERO } from "./constants.js";

/**
 * Check if value is a power of 2
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.ts').BrandedUint} value - Value to check
 * @returns {boolean} True if value is power of 2
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * Uint256.isPowerOf2(Uint256.from(16n)); // true
 * Uint256.isPowerOf2(Uint256.from(15n)); // false
 * ```
 */
export function isPowerOf2(value) {
	return value !== ZERO && (value & (value - 1n)) === ZERO;
}
