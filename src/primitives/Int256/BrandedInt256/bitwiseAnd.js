import { MODULO } from "./constants.js";

/**
 * Bitwise AND of Int256 values
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - First value
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Second value
 * @returns {import('./BrandedInt256.js').BrandedInt256} Result
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(0x0fn);
 * const b = Int256.from(0x07n);
 * Int256.bitwiseAnd(a, b); // 0x07n
 * ```
 */
export function bitwiseAnd(a, b) {
	// Convert to unsigned for bitwise ops
	const ua = a < 0n ? a + MODULO : a;
	const ub = b < 0n ? b + MODULO : b;

	const result = ua & ub;

	// Convert back to signed
	return /** @type {import('./BrandedInt256.js').BrandedInt256} */ (
		result >= MODULO / 2n ? result - MODULO : result
	);
}
