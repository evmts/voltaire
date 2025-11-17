import { MAX } from "./constants.js";

/**
 * Create Uint256 from bigint, number, or string (standard form)
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If value is out of range or invalid
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const a = Uint256.from(100n);
 * const b = Uint256.from("255");
 * const c = Uint256.from("0xff");
 * const d = Uint256.from(42);
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
			throw new Error(`Uint256 value must be an integer: ${value}`);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new Error(`Uint256 value cannot be negative: ${bigintValue}`);
	}

	if (bigintValue > MAX) {
		throw new Error(`Uint256 value exceeds maximum: ${bigintValue}`);
	}

	return bigintValue;
}
