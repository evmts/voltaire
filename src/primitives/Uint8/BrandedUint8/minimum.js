/**
 * Return minimum of two Uint8 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} a - First operand
 * @param {import('./BrandedUint8.js').BrandedUint8} b - Second operand
 * @returns {import('./BrandedUint8.js').BrandedUint8} Minimum value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(100);
 * const b = Uint8.from(50);
 * const min = Uint8.minimum(a, b); // 50
 * ```
 */
export function minimum(a, b) {
	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ (a < b ? a : b);
}
