/**
 * Get maximum of two values
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - First operand
 * @param {import('./BrandedUint128.js').BrandedUint128} b - Second operand
 * @returns {import('./BrandedUint128.js').BrandedUint128} Maximum value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from(50n);
 * const max = Uint128.maximum(a, b); // 100n
 * ```
 */
export function maximum(uint, b) {
	return uint > b ? uint : b;
}
