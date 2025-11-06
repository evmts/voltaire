/**
 * Create a copy of a Hex string
 *
 * @param {import('./BrandedHex.js').BrandedHex} hex - Hex string to clone
 * @returns {import('./BrandedHex.js').BrandedHex} Copy of the hex string
 *
 * @example
 * ```typescript
 * const hex1 = Hex.from("0x1234");
 * const hex2 = Hex.clone(hex1);
 * console.log(Hex.equals(hex1, hex2)); // true
 * console.log(hex1 === hex2); // true (strings are immutable)
 * ```
 */
export function clone(hex) {
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (hex.slice());
}
