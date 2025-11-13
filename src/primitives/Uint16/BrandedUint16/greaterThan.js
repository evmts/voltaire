/**
 * Check if first Uint16 is greater than second
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} a - First operand
 * @param {import('./BrandedUint16.js').BrandedUint16} b - Second operand
 * @returns {boolean} true if a > b
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(30000);
 * const b = Uint16.from(10000);
 * const isGreater = Uint16.greaterThan(a, b); // true
 * ```
 */
export function greaterThan(a, b) {
	return a > b;
}
