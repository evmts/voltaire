import { MODULO } from "./constants.js";
import { fromBigInt } from "./fromBigInt.js";

/**
 * Bitwise NOT of Int256 value
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Input value
 * @returns {import('./BrandedInt256.js').BrandedInt256} Result
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(0n);
 * Int256.bitwiseNot(a); // -1n
 * ```
 */
export function bitwiseNot(value) {
	// Convert to unsigned for bitwise ops
	const unsigned = value < 0n ? value + MODULO : value;

	const mask = MODULO - 1n;
	const result = ~unsigned & mask;

	// Convert back to signed
	return fromBigInt(result >= MODULO / 2n ? result - MODULO : result);
}
