import { InvalidRangeError } from "../errors/index.js";

/**
 * Modulo Int128 values (sign follows dividend)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} a - Dividend
 * @param {import('./Int128Type.js').BrandedInt128} b - Divisor
 * @returns {import('./Int128Type.js').BrandedInt128} Remainder (sign follows dividend)
 * @throws {InvalidRangeError} If divisor is zero
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
		throw new InvalidRangeError("Division by zero", {
			value: b,
			expected: "non-zero divisor",
			docsPath: "/primitives/int128#modulo",
		});
	}

	return /** @type {import('./Int128Type.js').BrandedInt128} */ (a % b);
}
