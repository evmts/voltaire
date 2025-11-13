import { MIN } from "./constants.js";

/**
 * Divide Int128 values (truncate toward zero)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - Dividend
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Divisor
 * @returns {import('./BrandedInt128.js').BrandedInt128} Quotient (truncated toward zero)
 * @throws {Error} If divisor is zero or MIN / -1 (overflow)
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-10n);
 * const b = Int128.from(3n);
 * const quotient = Int128.dividedBy(a, b); // -3n (not -4n)
 * ```
 */
export function dividedBy(a, b) {
	if (b === 0n) {
		throw new Error("Division by zero");
	}

	// Special case: MIN / -1 overflows
	if (a === MIN && b === -1n) {
		throw new Error("Int128 overflow: MIN / -1");
	}

	return a / b;
}
