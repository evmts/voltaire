import { MAX } from "./constants.js";
import {
	UintInvalidHexError,
	UintNegativeError,
	UintOverflowError,
} from "./errors.js";
import type { Uint256Type } from "./Uint256Type.js";

/**
 * Create Uint256 from hex string
 *
 * @param hex - Hex string to convert
 * @returns Uint256 value
 * @throws {UintInvalidHexError} If hex string is invalid
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 *
 * @example
 * ```typescript
 * const value = Uint.fromHex("0xff");
 * const value2 = Uint.fromHex("ff");
 * ```
 */
export function fromHex(hex: string): Uint256Type {
	if (typeof hex !== "string" || !/^(?:0[xX])?[0-9a-fA-F]+$/.test(hex)) {
		throw new UintInvalidHexError(`Invalid Uint256 hex string: ${hex}`, {
			value: hex,
		});
	}
	const normalized =
		hex.startsWith("0x") || hex.startsWith("0X") ? hex : `0x${hex}`;
	const value = BigInt(normalized);

	if (value < 0n) {
		throw new UintNegativeError(`Uint256 value cannot be negative: ${value}`, {
			value,
		});
	}

	if (value > MAX) {
		throw new UintOverflowError(`Uint256 value exceeds maximum: ${value}`, {
			value,
			context: { max: MAX },
		});
	}

	return value as Uint256Type;
}
