import { MAX, MIN } from "./constants.js";

/**
 * Create Int256 from number
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {number} value - Integer number
 * @returns {import('./BrandedInt256.js').BrandedInt256} Int256 value
 * @throws {Error} If value is not an integer or out of range
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.fromNumber(-42);
 * const b = Int256.fromNumber(100);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Error(`Int256 value must be an integer: ${value}`);
	}

	const bigintValue = BigInt(value);

	if (bigintValue < MIN) {
		throw new Error(`Int256 value below minimum (${MIN}): ${bigintValue}`);
	}

	if (bigintValue > MAX) {
		throw new Error(`Int256 value exceeds maximum (${MAX}): ${bigintValue}`);
	}

	return bigintValue;
}
