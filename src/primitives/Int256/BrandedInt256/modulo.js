/**
 * Modulo Int256 values (EVM SMOD - signed modulo, sign follows dividend)
 *
 * EVM SMOD semantics:
 * - Sign of result follows dividend (first operand)
 * - -10 % 3 = -1 (not 2)
 * - 10 % -3 = 1 (not -2)
 * - Property: a = (a/b)*b + (a%b)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @see https://eips.ethereum.org/EIPS/eip-145 for EVM SMOD specification
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - Dividend
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Divisor
 * @returns {import('./BrandedInt256.js').BrandedInt256} Remainder (sign follows dividend)
 * @throws {Error} If divisor is zero
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * // EVM SMOD examples
 * const a = Int256.from(-10n);
 * const b = Int256.from(3n);
 * Int256.modulo(a, b); // -1n (sign follows dividend -10)
 *
 * const c = Int256.from(10n);
 * const d = Int256.from(-3n);
 * Int256.modulo(c, d); // 1n (sign follows dividend 10)
 * ```
 */
export function modulo(a, b) {
	if (b === 0n) {
		throw new Error("Division by zero");
	}

	// BigInt % already follows dividend sign (matches EVM SMOD)
	return a % b;
}
