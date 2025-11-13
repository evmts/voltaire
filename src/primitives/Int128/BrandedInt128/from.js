import { MAX, MIN } from "./constants.js";

/**
 * Create Int128 from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./BrandedInt128.js').BrandedInt128} Int128 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-100n);
 * const b = Int128.from("-255");
 * const c = Int128.from("0xff");
 * const d = Int128.from(-42);
 * ```
 */
export function from(value) {
	let bigintValue;

	if (typeof value === "string") {
		if (value.startsWith("0x") || value.startsWith("0X")) {
			bigintValue = BigInt(value);
		} else {
			bigintValue = BigInt(value);
		}
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new Error(`Int128 value must be an integer: ${value}`);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < MIN) {
		throw new Error(
			`Int128 value below minimum (${MIN}): ${bigintValue}`,
		);
	}

	if (bigintValue > MAX) {
		throw new Error(
			`Int128 value exceeds maximum (${MAX}): ${bigintValue}`,
		);
	}

	return bigintValue;
}
