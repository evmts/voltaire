/**
 * Create a copy of a Hex string
 *
 * @this {import('./BrandedHex.js').BrandedHex}
 * @returns {import('./BrandedHex.js').BrandedHex} Copy of the hex string
 *
 * @example
 * ```typescript
 * const hex1 = Hex.from("0x1234");
 * const hex2 = Hex.clone(hex1);
 * console.log(Hex.equals(hex1, hex2)); // true
 * console.log(hex1 === hex2); // false (different string instances)
 * ```
 */
export function clone() {
	return /** @type {import('./BrandedHex.js').BrandedHex} */ (this.slice());
}
