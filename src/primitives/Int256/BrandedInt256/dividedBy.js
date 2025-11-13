import { MIN } from "./constants.js";

/**
 * Divide Int256 values (EVM SDIV - signed division, truncate toward zero)
 *
 * EVM SDIV semantics:
 * - Truncates toward zero (not floor division)
 * - -10 / 3 = -3 (not -4)
 * - MIN / -1 overflows (throws error)
 * - 0 / 0 throws error
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @see https://eips.ethereum.org/EIPS/eip-145 for EVM SDIV specification
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - Dividend
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Divisor
 * @returns {import('./BrandedInt256.js').BrandedInt256} Quotient (truncated toward zero)
 * @throws {Error} If divisor is zero or MIN / -1 (overflow)
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * // EVM SDIV examples
 * const a = Int256.from(-10n);
 * const b = Int256.from(3n);
 * Int256.dividedBy(a, b); // -3n (truncate toward zero, not -4n)
 *
 * const c = Int256.from(10n);
 * const d = Int256.from(-3n);
 * Int256.dividedBy(c, d); // -3n (truncate toward zero)
 * ```
 */
export function dividedBy(a, b) {
	if (b === 0n) {
		throw new Error("Division by zero");
	}

	// EVM SDIV special case: MIN / -1 overflows
	// In two's complement, -MIN doesn't exist in range
	if (a === MIN && b === -1n) {
		throw new Error("Int256 overflow: MIN / -1 (EVM SDIV overflow)");
	}

	// BigInt / already truncates toward zero (matches EVM SDIV)
	return a / b;
}
