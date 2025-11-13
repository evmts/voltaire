/**
 * Check if value is a power of 2
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Value to check
 * @returns {boolean} True if power of 2
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(16n);
 * Uint128.isPowerOf2(a); // true
 * const b = Uint128.from(15n);
 * Uint128.isPowerOf2(b); // false
 * ```
 */
export function isPowerOf2(uint) {
	return uint > 0n && (uint & (uint - 1n)) === 0n;
}
