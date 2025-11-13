import { MAX, MIN } from "./constants.js";

/**
 * Create Int128 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {bigint} value - BigInt value
 * @returns {import('./BrandedInt128.js').BrandedInt128} Int128 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.fromBigInt(-42n);
 * const b = Int128.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value) {
	if (value < MIN) {
		throw new Error(`Int128 value below minimum (${MIN}): ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Int128 value exceeds maximum (${MAX}): ${value}`);
	}

	return value;
}
