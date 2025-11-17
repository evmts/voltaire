import { MAX, MIN } from "./constants.js";

/**
 * Check if value is valid Int256
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {bigint} value - Value to check
 * @returns {boolean} True if valid Int256
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * Int256.isValid(-42n); // true
 * Int256.isValid(2n ** 127n); // false (exceeds MAX)
 * ```
 */
export function isValid(value) {
	return typeof value === "bigint" && value >= MIN && value <= MAX;
}
