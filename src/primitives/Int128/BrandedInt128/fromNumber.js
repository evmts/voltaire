import { MAX, MIN } from "./constants.js";

/**
 * Create Int128 from number
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {number} value - Integer number
 * @returns {import('./BrandedInt128.js').BrandedInt128} Int128 value
 * @throws {Error} If value is not an integer or out of range
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.fromNumber(-42);
 * const b = Int128.fromNumber(100);
 * ```
 */
export function fromNumber(value) {
	if (!Number.isInteger(value)) {
		throw new Error(`Int128 value must be an integer: ${value}`);
	}

	const bigintValue = BigInt(value);

	if (bigintValue < MIN) {
		throw new Error(`Int128 value below minimum (${MIN}): ${bigintValue}`);
	}

	if (bigintValue > MAX) {
		throw new Error(`Int128 value exceeds maximum (${MAX}): ${bigintValue}`);
	}

	return bigintValue;
}
