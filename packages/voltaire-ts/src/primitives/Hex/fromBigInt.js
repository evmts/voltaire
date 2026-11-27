import {
	InvalidFormatError,
	InvalidSizeError,
	NegativeNumberError,
} from "./errors.js";

/**
 * Convert bigint to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {bigint} value - BigInt to convert (must be non-negative)
 * @param {number} [size] - Optional byte size for padding
 * @returns {import('./HexType.js').HexType} Hex string
 * @throws {InvalidFormatError} If value is not a bigint
 * @throws {NegativeNumberError} If value is negative
 * @throws {InvalidSizeError} If size is not a non-negative integer
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromBigInt(255n);      // '0xff'
 * Hex.fromBigInt(255n, 32);  // '0x00...00ff' (32 bytes)
 * ```
 */
export function fromBigInt(value, size) {
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
	return /** @type {import('./HexType.js').HexType} */ (`0x${hex}`);
}
