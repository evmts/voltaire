/**
 * Divide two Uint16 values (integer division)
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint16.js').BrandedUint16} a - Dividend
 * @param {import('./BrandedUint16.js').BrandedUint16} b - Divisor
 * @returns {import('./BrandedUint16.js').BrandedUint16} Quotient (floor(a / b))
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(10000);
 * const b = Uint16.from(100);
 * const quotient = Uint16.dividedBy(a, b); // 100
 * ```
 */
export function dividedBy(a, b) {
	if (b === 0) {
		throw new Error("Division by zero");
	}
	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (
		Math.floor(a / b)
	);
}
