/**
 * Convert number to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {number} value - Number to convert
 * @param {number} [size] - Optional byte size for padding
 * @returns {import('./BrandedHex.js').BrandedHex} Hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromNumber(255);     // '0xff'
 * Hex.fromNumber(255, 2);  // '0x00ff'
 * Hex.fromNumber(0x1234);  // '0x1234'
 * ```
 */
export function fromNumber(value, size) {
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (`0x${hex}`);
}
