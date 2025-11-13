/**
 * Convert Uint32 to string
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Uint32 value to convert
 * @returns {string} decimal string representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.from(255);
 * const str = Uint32.toString(value); // "255"
 * ```
 */
export function toString(uint) {
	return uint.toString();
}
