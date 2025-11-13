/**
 * Check if first Uint8 is less than second
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} a - First operand
 * @param {import('./BrandedUint8.js').BrandedUint8} b - Second operand
 * @returns {boolean} true if a < b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(50);
 * const b = Uint8.from(100);
 * const isLess = Uint8.lessThan(a, b); // true
 * ```
 */
export function lessThan(a, b) {
	return a < b;
}
