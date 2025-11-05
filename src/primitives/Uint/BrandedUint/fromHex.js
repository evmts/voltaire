import { MAX } from "./constants.js";

/**
 * Create Uint256 from hex string
 *
 * @param {string} hex - Hex string to convert
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If hex is invalid or value out of range
 *
 * @example
 * ```typescript
 * const value = Uint.fromHex("0xff");
 * const value2 = Uint.fromHex("ff");
 * ```
 */
export function fromHex(hex) {
	const normalized = hex.startsWith("0x") ? hex : `0x${hex}`;
	const value = BigInt(normalized);

	if (value < 0n) {
		throw new Error(`Uint256 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint256 value exceeds maximum: ${value}`);
	}

	return value;
}
