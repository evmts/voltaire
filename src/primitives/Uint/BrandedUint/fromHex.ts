import type { BrandedUint } from "./BrandedUint.js";
import { MAX } from "./constants.js";
import { UintNegativeError, UintOverflowError } from "./errors.js";

/**
 * Create Uint256 from hex string
 *
 * @param hex - Hex string to convert
 * @returns Uint256 value
 * @throws {UintNegativeError} If value is negative
 * @throws {UintOverflowError} If value exceeds maximum
 *
 * @example
 * ```typescript
 * const value = Uint.fromHex("0xff");
 * const value2 = Uint.fromHex("ff");
 * ```
 */
export function fromHex(hex: string): BrandedUint {
	const normalized = hex.startsWith("0x") ? hex : `0x${hex}`;
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

	return value as BrandedUint;
}
