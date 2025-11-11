/**
 * Create a copy of a Hex string
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to clone
 * @returns {import('./BrandedHex.js').BrandedHex} Copy of the hex string
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex1 = Hex.from("0x1234");
 * const hex2 = Hex.clone(hex1);
 * console.log(Hex.equals(hex1, hex2)); // true
 * ```
 */
export function clone(hex) {
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (hex.slice());
}
