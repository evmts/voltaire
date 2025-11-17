import { MAX, MIN } from "./constants.js";

/**
 * Check if value is valid Int128
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {bigint} value - Value to check
 * @returns {boolean} True if valid Int128
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * Int128.isValid(-42n); // true
 * Int128.isValid(2n ** 127n); // false (exceeds MAX)
 * ```
 */
export function isValid(value) {
	return typeof value === "bigint" && value >= MIN && value <= MAX;
}
