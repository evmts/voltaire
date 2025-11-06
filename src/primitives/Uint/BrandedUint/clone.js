/**
 * Create a copy of a Uint256 value
 *
 * @param {import('./BrandedUint.js').BrandedUint} uint - Uint256 value to clone
 * @returns {import('./BrandedUint.js').BrandedUint} Copy of the value
 *
 * @example
 * ```typescript
 * const n1 = Uint.from(100n);
 * const n2 = Uint.clone(n1);
 * console.log(Uint.equals(n1, n2)); // true
 * console.log(n1 === n2); // true (bigints are primitives)
 * ```
 */
export function clone(uint) {
	return uint;
}
