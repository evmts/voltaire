/**
 * Convert Uint16 to decimal string
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Uint16 value
 * @returns {string} Decimal string representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.from(65535);
 * const str = Uint16.toString(value); // "65535"
 * ```
 */
export function toString(uint) {
	return uint.toString();
}
