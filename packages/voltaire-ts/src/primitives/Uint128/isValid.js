import { MAX } from "./constants.js";

/**
 * Check if value is valid Uint128
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - Value to check
 * @returns {boolean} True if valid
 * @throws {never}
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * Uint128.isValid(100n); // true
 * Uint128.isValid(-1); // false
 * ```
 */
export function isValid(value) {
	try {
		let bigintValue;

		if (typeof value === "string") {
			bigintValue = BigInt(value);
		} else if (typeof value === "number") {
			if (!Number.isInteger(value)) {
				return false;
			}
			bigintValue = BigInt(value);
		} else if (typeof value === "bigint") {
			bigintValue = value;
		} else {
			return false;
		}

		return bigintValue >= 0n && bigintValue <= MAX;
	} catch {
		return false;
	}
}
