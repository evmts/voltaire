import { MAX, MIN, MODULO } from "./constants.js";

/**
 * Subtract Int256 values with wrapping (EVM SUB with signed interpretation)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} a - Minuend
 * @param {import('./BrandedInt256.js').BrandedInt256} b - Subtrahend
 * @returns {import('./BrandedInt256.js').BrandedInt256} Difference with wrapping
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(100n);
 * const b = Int256.from(50n);
 * const diff = Int256.minus(a, b); // 50n
 * ```
 */
export function minus(a, b) {
	const diff = a - b;

	// Handle wrapping
	if (diff > MAX) {
		return diff - MODULO;
	}
	if (diff < MIN) {
		return diff + MODULO;
	}

	return diff;
}
