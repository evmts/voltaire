import { MIN } from "./constants.js";

/**
 * Absolute value of Int256
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Input value
 * @returns {import('./BrandedInt256.js').BrandedInt256} Absolute value
 * @throws {Error} If value is MIN (abs(MIN) overflows)
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-42n);
 * Int256.abs(a); // 42n
 * ```
 */
export function abs(value) {
	if (value === MIN) {
		throw new Error("Int256 overflow: abs(MIN)");
	}

	return /** @type {import('./BrandedInt256.js').BrandedInt256} */ (
		value < 0n ? -value : value
	);
}
