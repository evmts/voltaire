/**
 * Check if Uint32 value is zero
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Value to check
 * @returns {boolean} true if zero
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(0);
 * const result = Uint32.isZero(a); // true
 * ```
 */
export function isZero(uint) {
	return uint === 0;
}
