import { MAX, MIN } from "./constants.js";

/**
 * Create Int256 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {bigint} value - BigInt value
 * @returns {import('./BrandedInt256.js').BrandedInt256} Int256 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.fromBigInt(-42n);
 * const b = Int256.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value) {
	if (value < MIN) {
		throw new Error(
			`Int256 value below minimum (${MIN}): ${value}`,
		);
	}

	if (value > MAX) {
		throw new Error(
			`Int256 value exceeds maximum (${MAX}): ${value}`,
		);
	}

	return value;
}
