import { MAX } from "./constants.js";
import {
	UintInvalidHexError,
	UintNegativeError,
	UintNotIntegerError,
	UintOverflowError,
} from "./errors.js";
import type { Uint256Type } from "./Uint256Type.js";

/**
 * Create Uint256 from bigint or string (standard form)
 *
 * @param value - bigint or decimal/hex string
 * @returns Uint256 value
 * @throws {UintInvalidHexError} If string format is invalid
 * @throws {UintNotIntegerError} If value is not an integer or unsupported type
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 *
 * @example
 * ```typescript
 * const a = Uint.from(100n);
 * const b = Uint.from("255");
 * const c = Uint.from("0xff");
 * ```
 */
export function from(value: bigint | number | string): Uint256Type {
	let bigintValue: bigint;

	if (typeof value === "string") {
		if (!/^0[xX][0-9a-fA-F]+$/.test(value) && !/^-?[0-9]+$/.test(value)) {
			throw new UintInvalidHexError(`Invalid Uint256 string: ${value}`, {
				value,
			});
		}
		bigintValue = BigInt(value);
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new UintNotIntegerError(
				`Uint256 value must be an integer: ${value}`,
				{ value },
			);
		}
		bigintValue = BigInt(value);
	} else if (typeof value === "bigint") {
		bigintValue = value;
	} else {
		throw new UintNotIntegerError(
			`Invalid Uint256 value type: ${typeof value}`,
			{ value },
		);
	}

	if (bigintValue < 0n) {
		throw new UintNegativeError(
			`Uint256 value cannot be negative: ${bigintValue}`,
			{ value: bigintValue },
		);
	}

	if (bigintValue > MAX) {
		throw new UintOverflowError(
			`Uint256 value exceeds maximum: ${bigintValue}`,
			{
				value: bigintValue,
				max: MAX,
			},
		);
	}

	return bigintValue as Uint256Type;
}
