/**
 * Modulo Uint64 value
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {import('./BrandedUint64.js').BrandedUint64} uint - Dividend
 * @param {import('./BrandedUint64.js').BrandedUint64} b - Divisor
 * @returns {import('./BrandedUint64.js').BrandedUint64} Remainder (uint % b)
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from(3n);
 * const remainder = Uint64.modulo(a, b); // 1n
 * ```
 */
export function modulo(uint, b) {
	if (b === 0n) {
		throw new Error("Modulo by zero");
	}
	return uint % b;
}
