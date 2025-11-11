import { MAX } from "./constants.js";

/**
 * Check if value is a valid Uint256
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {boolean} true if value is valid Uint256
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const isValid = Uint256.isValid(100n); // true
 * const isInvalid = Uint256.isValid(-1n); // false
 * ```
 */
export function isValid(value) {
	if (typeof value !== "bigint") return false;
	return value >= 0n && value <= MAX;
}
