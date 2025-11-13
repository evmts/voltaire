/**
 * Check if Uint8 value is zero
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Uint8 value
 * @returns {boolean} true if uint === 0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(0);
 * const b = Uint8.from(100);
 * Uint8.isZero(a); // true
 * Uint8.isZero(b); // false
 * ```
 */
export function isZero(uint) {
	return uint === 0;
}
