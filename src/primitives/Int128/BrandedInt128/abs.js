import { MIN } from "./constants.js";

/**
 * Absolute value of Int128
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Input value
 * @returns {import('./BrandedInt128.js').BrandedInt128} Absolute value
 * @throws {Error} If value is MIN (abs(MIN) overflows)
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-42n);
 * Int128.abs(a); // 42n
 * ```
 */
export function abs(value) {
	if (value === MIN) {
		throw new Error("Int128 overflow: abs(MIN)");
	}

	return value < 0n ? -value : value;
}
