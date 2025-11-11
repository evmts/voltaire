import { MAX } from "./constants.js";

/**
 * Create Uint256 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint for Uint documentation
 * @since 0.0.0
 * @param {string} hex - Hex string to convert
 * @returns {import('./BrandedUint.js').BrandedUint} Uint256 value
 * @throws {Error} If hex is invalid or value out of range
 * @example
 * ```javascript
 * import * as Uint256 from './primitives/Uint/index.js';
 * const value = Uint256.fromHex("0xff");
 * const value2 = Uint256.fromHex("ff");
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
