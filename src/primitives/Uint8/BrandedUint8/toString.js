/**
 * Convert Uint8 to decimal string
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Uint8 value
 * @returns {string} Decimal string representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.from(255);
 * const str = Uint8.toString(value); // "255"
 * ```
 */
export function toString(uint) {
	return uint.toString();
}
