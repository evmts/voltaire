import type { BrandedUint } from "./BrandedUint.js";
import { MAX } from "./constants.js";

/**
 * Create Uint256 from hex string
 *
 * @param hex - Hex string to convert
 * @returns Uint256 value
 * @throws Error if hex is invalid or value out of range
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
		throw new Error(`Uint256 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint256 value exceeds maximum: ${value}`);
	}

	return value as BrandedUint;
}
