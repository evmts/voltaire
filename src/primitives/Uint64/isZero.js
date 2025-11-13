/**
 * Check if Uint64 value is zero
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Value to check
 * @returns {boolean} true if zero
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(0n);
 * const result = Uint64.isZero(a); // true
 * ```
 */
export function isZero(uint) {
	return uint === 0n;
}
