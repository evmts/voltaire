import { UintNotIntegerError } from "./errors.js";
import { from } from "./from.js";

/**
 * Create Uint256 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {number} value - number to convert
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {UintNotIntegerError} If value is not an integer
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.fromNumber(255);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new UintNotIntegerError(`Uint256 value must be an integer: ${value}`, {
			value,
		});
	}
	return from(value);
}
