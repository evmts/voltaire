/**
 * Convert Uint32 to hex string (with 0x prefix)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Uint32 value to convert
 * @returns {string} hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.from(255);
 * const hex = Uint32.toHex(value); // "0xff"
 * ```
 */
export function toHex(uint) {
	return `0x${uint.toString(16)}`;
}
