/**
 * Check greater than
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - First operand
 * @param {import('./BrandedUint128.js').BrandedUint128} b - Second operand
 * @returns {boolean} True if uint > b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(50n);
 * Uint128.greaterThan(a, b); // true
 * ```
 */
export function greaterThan(uint, b) {
	return uint > b;
}
