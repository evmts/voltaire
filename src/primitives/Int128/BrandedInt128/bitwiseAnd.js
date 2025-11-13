import { MODULO } from "./constants.js";
import { fromBigInt } from "./fromBigInt.js";

/**
 * Bitwise AND of Int128 values
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} a - First value
 * @param {import('./BrandedInt128.js').BrandedInt128} b - Second value
 * @returns {import('./BrandedInt128.js').BrandedInt128} Result
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(0x0fn);
 * const b = Int128.from(0x07n);
 * Int128.bitwiseAnd(a, b); // 0x07n
 * ```
 */
export function bitwiseAnd(a, b) {
	// Convert to unsigned for bitwise ops
	const ua = a < 0n ? a + MODULO : a;
	const ub = b < 0n ? b + MODULO : b;

	const result = ua & ub;

	// Convert back to signed
	return fromBigInt(result >= MODULO / 2n ? result - MODULO : result);
}
