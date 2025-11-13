/**
 * Convert Uint16 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} uint - Uint16 value
 * @param {boolean} [padded=true] - Whether to pad to 4 characters (2 bytes)
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.from(65535);
 * const hex1 = Uint16.toHex(value); // "0xffff"
 * const hex2 = Uint16.toHex(value, false); // "0xffff"
 * const value2 = Uint16.from(15);
 * const hex3 = Uint16.toHex(value2); // "0x000f"
 * const hex4 = Uint16.toHex(value2, false); // "0xf"
 * ```
 */
export function toHex(uint, padded = true) {
	const hex = uint.toString(16);
	return padded ? `0x${hex.padStart(4, "0")}` : `0x${hex}`;
}
