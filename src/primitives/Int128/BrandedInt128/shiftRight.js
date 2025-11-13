import { BITS } from "./constants.js";

/**
 * Arithmetic right shift of Int128 (sign-preserving)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./BrandedInt128.js').BrandedInt128} Shifted value (sign-extended)
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-256n);
 * Int128.shiftRight(a, 1); // -128n (sign preserved)
 * ```
 */
export function shiftRight(value, shift) {
	const shiftAmount = BigInt(shift);

	if (shiftAmount < 0n) {
		throw new Error("Shift amount must be non-negative");
	}

	if (shiftAmount >= BigInt(BITS)) {
		// Return all 1s for negative, 0 for positive
		return value < 0n ? -1n : 0n;
	}

	// BigInt >> preserves sign (arithmetic shift)
	return value >> shiftAmount;
}
