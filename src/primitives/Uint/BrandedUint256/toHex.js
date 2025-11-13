/**
 * Convert Uint256 to hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to convert
 * @param {boolean} [padded=true] - Whether to pad to 64 characters (32 bytes)
 * @returns {string} Hex string with 0x prefix
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.from(255n);
 * const hex1 = Uint256.toHex(value); // "0x00...ff"
 * const hex2 = Uint256.toHex(value, false); // "0xff"
 * ```
 */
export function toHex(uint, padded = true) {
	const hex = uint.toString(16);
	return padded ? `0x${hex.padStart(64, "0")}` : `0x${hex}`;
}
