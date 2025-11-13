/**
 * Subtract two Uint8 values with underflow checking
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint8.js').BrandedUint8} a - First operand
 * @param {import('./BrandedUint8.js').BrandedUint8} b - Second operand
 * @returns {import('./BrandedUint8.js').BrandedUint8} Difference (a - b)
 * @throws {Error} If result is negative
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(100);
 * const b = Uint8.from(50);
 * const diff = Uint8.minus(a, b); // 50
 * ```
 */
export function minus(a, b) {
	if (a < b) {
		throw new Error(`Uint8 underflow: ${a} - ${b} = ${a - b} is negative`);
	}
	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ (a - b);
}
