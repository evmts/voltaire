import { BITS, MODULO } from "./constants.js";

/**
 * Shift Int128 left with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./BrandedInt128.js').BrandedInt128} Shifted value
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(1n);
 * Int128.shiftLeft(a, 8); // 256n
 * ```
 */
export function shiftLeft(value, shift) {
	const shiftAmount = BigInt(shift);

	if (shiftAmount < 0n) {
		throw new Error("Shift amount must be non-negative");
	}

	if (shiftAmount >= BigInt(BITS)) {
		return 0n;
	}

	// Convert to unsigned for shift
	const unsigned = value < 0n ? value + MODULO : value;

	const shifted = (unsigned << shiftAmount) & (MODULO - 1n);

	// Convert back to signed
	return /** @type {import("./BrandedInt128.js").BrandedInt128} */ (
		shifted >= MODULO / 2n ? shifted - MODULO : shifted
	);
}
