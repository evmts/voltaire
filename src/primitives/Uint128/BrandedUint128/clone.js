/**
 * Clone Uint128 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint128.js').BrandedUint128} uint - Value to clone
 * @returns {import('./BrandedUint128.js').BrandedUint128} Cloned value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.clone(a);
 * ```
 */
export function clone(uint) {
	return uint;
}
