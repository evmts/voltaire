import {
	InvalidFormatError,
	InvalidSizeError,
	NegativeNumberError,
} from "./errors.js";
import type { HexType } from "./HexType.js";

/**
 * Convert bigint to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param value - BigInt to convert (must be non-negative)
 * @param size - Optional byte size for padding
 * @returns Hex string
 * @throws {InvalidFormatError} If value is not a bigint
 * @throws {NegativeNumberError} If value is negative
 * @throws {InvalidSizeError} If size is not a non-negative integer
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromBigInt(255n);      // '0xff'
 * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
 * ```
 */
export function fromBigInt(value: bigint, size?: number): HexType {
	if (typeof value !== "bigint") {
		throw new InvalidFormatError(`Expected bigint, got ${typeof value}`, {
			value,
			expected: "non-negative bigint",
		});
	}
	if (value < 0n) {
		throw new NegativeNumberError(
			`Cannot convert negative bigint to hex: ${value}`,
			{ value },
		);
	}
	if (size !== undefined && (!Number.isInteger(size) || size < 0)) {
		throw new InvalidSizeError(`Invalid size parameter: ${size}`, {
			value: size,
		});
	}
	let hex = value.toString(16);
	if (size !== undefined) {
		hex = hex.padStart(size * 2, "0");
	}
	return `0x${hex}` as HexType;
}
