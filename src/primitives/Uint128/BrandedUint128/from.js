import { MAX } from "./constants.js";

/**
 * Create Uint128 from bigint, number, or string (standard form)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./BrandedUint128.js').BrandedUint128} Uint128 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from("255");
 * const c = Uint128.from("0xff");
 * const d = Uint128.from(42);
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
			throw new Error(`Uint128 value must be an integer: ${value}`);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new Error(`Uint128 value cannot be negative: ${bigintValue}`);
	}

	if (bigintValue > MAX) {
		throw new Error(`Uint128 value exceeds maximum: ${bigintValue}`);
	}

	return bigintValue;
}
