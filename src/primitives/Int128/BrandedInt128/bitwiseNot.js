import { MODULO } from "./constants.js";

/**
 * Bitwise NOT of Int128 value
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Input value
 * @returns {import('./BrandedInt128.js').BrandedInt128} Result
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(0n);
 * Int128.bitwiseNot(a); // -1n
 * ```
 */
export function bitwiseNot(value) {
	// Convert to unsigned for bitwise ops
	const unsigned = value < 0n ? value + MODULO : value;

	const mask = MODULO - 1n;
	const result = ~unsigned & mask;

	// Convert back to signed
	return /** @type {import("./BrandedInt128.js").BrandedInt128} */ (
		result >= MODULO / 2n ? result - MODULO : result
	);
}
