/**
 * Modulo Int128 values (sign follows dividend)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - Dividend
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Divisor
 * @returns {import('./BrandedInt128.js').BrandedInt128} Remainder (sign follows dividend)
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-10n);
 * const b = Int128.from(3n);
 * const remainder = Int128.modulo(a, b); // -1n (not 2n)
 * ```
 */
export function modulo(a, b) {
	if (b === 0n) {
		throw new Error("Division by zero");
	}

	return a % b;
}
