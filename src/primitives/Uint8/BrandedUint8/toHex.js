/**
 * Convert Uint8 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} uint - Uint8 value
 * @param {boolean} [padded=true] - Whether to pad to 2 characters (1 byte)
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.from(255);
 * const hex1 = Uint8.toHex(value); // "0xff"
 * const hex2 = Uint8.toHex(value, false); // "0xff"
 * const value2 = Uint8.from(15);
 * const hex3 = Uint8.toHex(value2); // "0x0f"
 * const hex4 = Uint8.toHex(value2, false); // "0xf"
 * ```
 */
export function toHex(uint, padded = true) {
	const hex = uint.toString(16);
	return padded ? `0x${hex.padStart(2, "0")}` : `0x${hex}`;
}
