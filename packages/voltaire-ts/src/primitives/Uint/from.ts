import { MAX } from "./constants.js";
import {
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
 * @throws {UintNotIntegerError} If number value is not an integer
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
		if (value.startsWith("0x") || value.startsWith("0X")) {
			bigintValue = BigInt(value);
		} else {
			bigintValue = BigInt(value);
		}
	} else if (typeof value === "number") {
		if (!Number.isInteger(value)) {
			throw new UintNotIntegerError(
				`Uint256 value must be an integer: ${value}`,
				{ value },
			);
		}
		bigintValue = BigInt(value);
	} else {
		bigintValue = value;
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
