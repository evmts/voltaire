/**
 * Check if Uint64 value is less than another
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - First value
 * @param {import('./BrandedUint64.js').BrandedUint64} b - Second value
 * @returns {boolean} true if uint < b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(200n);
 * const result = Uint64.lessThan(a, b); // true
 * ```
 */
export function lessThan(uint, b) {
	return uint < b;
}
