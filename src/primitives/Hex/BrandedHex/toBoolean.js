import * as OxHex from "ox/Hex";

/**
 * Convert hex to boolean
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to convert
 * @returns {boolean} Boolean value (true if non-zero, false if zero)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x01');
 * const bool = Hex.toBoolean(hex); // true
 * ```
 */
export function toBoolean(hex) {
	const bytes = OxHex.toBytes(hex);
	return bytes.some((b) => b !== 0);
}
