/**
 * Compute modulo of two Uint16 values
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} a - Dividend
 * @param {import('./BrandedUint16.js').BrandedUint16} b - Divisor
 * @returns {import('./BrandedUint16.js').BrandedUint16} Remainder (a % b)
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(10007);
 * const b = Uint16.from(1000);
 * const remainder = Uint16.modulo(a, b); // 7
 * ```
 */
export function modulo(a, b) {
	if (b === 0) {
		throw new Error("Division by zero");
	}
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (a % b);
}
