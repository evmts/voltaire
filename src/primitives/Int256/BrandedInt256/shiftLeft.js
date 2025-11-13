import { BITS, MODULO } from "./constants.js";
import { fromBigInt } from "./fromBigInt.js";

/**
 * Shift Int256 left with wrapping
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Value to shift
 * @param {number | bigint} shift - Shift amount
 * @returns {import('./BrandedInt256.js').BrandedInt256} Shifted value
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(1n);
 * Int256.shiftLeft(a, 8); // 256n
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
	return fromBigInt(shifted >= MODULO / 2n ? shifted - MODULO : shifted);
}
