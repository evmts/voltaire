/**
 * Modulo Uint32 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint32.js').BrandedUint32} uint - Dividend
 * @param {import('./BrandedUint32.js').BrandedUint32} b - Divisor
 * @returns {import('./BrandedUint32.js').BrandedUint32} Remainder (uint % b)
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from(3);
 * const remainder = Uint32.modulo(a, b); // 1
 * ```
 */
export function modulo(uint, b) {
	if (b === 0) {
		throw new Error("Modulo by zero");
	}
	return uint % b;
}
