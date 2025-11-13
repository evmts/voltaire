/**
 * Return maximum of two Uint16 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} a - First operand
 * @param {import('./BrandedUint16.js').BrandedUint16} b - Second operand
 * @returns {import('./BrandedUint16.js').BrandedUint16} Maximum value
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(30000);
 * const b = Uint16.from(10000);
 * const max = Uint16.maximum(a, b); // 30000
 * ```
 */
export function maximum(a, b) {
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (
		a > b ? a : b
	);
}
