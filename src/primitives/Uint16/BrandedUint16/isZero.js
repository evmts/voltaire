/**
 * Check if Uint16 value is zero
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Uint16 value
 * @returns {boolean} true if uint === 0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(0);
 * const b = Uint16.from(100);
 * Uint16.isZero(a); // true
 * Uint16.isZero(b); // false
 * ```
 */
export function isZero(uint) {
	return uint === 0;
}
