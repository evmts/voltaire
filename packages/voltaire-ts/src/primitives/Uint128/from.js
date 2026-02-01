import { MAX } from "./constants.js";
import {
	Uint128NegativeError,
	Uint128NotIntegerError,
	Uint128OverflowError,
} from "./errors.js";

/**
 * Create Uint128 from bigint, number, or string (standard form)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./Uint128Type.js').Uint128Type} Uint128 value
 * @throws {Uint128NotIntegerError} If number is not an integer
 * @throws {Uint128NegativeError} If value is negative
 * @throws {Uint128OverflowError} If value exceeds maximum
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
			throw new Uint128NotIntegerError(
				`Uint128 value must be an integer: ${value}`,
				{ value },
			);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
	}

	if (bigintValue < 0n) {
		throw new Uint128NegativeError(
			`Uint128 value cannot be negative: ${bigintValue}`,
			{ value: bigintValue },
		);
	}

	if (bigintValue > MAX) {
		throw new Uint128OverflowError(
			`Uint128 value exceeds maximum: ${bigintValue}`,
			{ value: bigintValue },
		);
	}

	return /** @type {import('./Uint128Type.js').Uint128Type} */ (bigintValue);
}
