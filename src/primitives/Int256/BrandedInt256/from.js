import { MAX, MIN } from "./constants.js";

/**
 * Create Int256 from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./BrandedInt256.js').BrandedInt256} Int256 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-100n);
 * const b = Int256.from("-255");
 * const c = Int256.from("0xff");
 * const d = Int256.from(-42);
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
			throw new Error(`Int256 value must be an integer: ${value}`);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < MIN) {
		throw new Error(
			`Int256 value below minimum (${MIN}): ${bigintValue}`,
		);
	}

	if (bigintValue > MAX) {
		throw new Error(
			`Int256 value exceeds maximum (${MAX}): ${bigintValue}`,
		);
	}

	return bigintValue;
}
