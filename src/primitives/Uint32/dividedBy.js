/**
 * Divide Uint32 value (integer division)
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Dividend
 * @param {import('./BrandedUint32.js').BrandedUint32} b - Divisor
 * @returns {import('./BrandedUint32.js').BrandedUint32} Quotient (uint / b) truncated
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(3);
 * const quotient = Uint32.dividedBy(a, b); // 33
 * ```
 */
export function dividedBy(uint, b) {
	if (b === 0) {
		throw new Error("Division by zero");
	}
	return Math.floor(uint / b);
}
