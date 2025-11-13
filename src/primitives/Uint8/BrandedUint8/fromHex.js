import { MAX } from "./constants.js";

/**
 * Create Uint8 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./BrandedUint8.js').BrandedUint8} Uint8 value
 * @throws {Error} If hex is invalid or out of range
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.fromHex("0xff");
 * const b = Uint8.fromHex("ff");
 * ```
 */
export function fromHex(hex) {
	const cleanHex =
		hex.startsWith("0x") || hex.startsWith("0X") ? hex : `0x${hex}`;
	const value = Number.parseInt(cleanHex, 16);

	if (Number.isNaN(value)) {
		throw new Error(`Invalid hex string: ${hex}`);
	}

	if (value < 0) {
		throw new Error(`Uint8 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint8 value exceeds maximum (255): ${value}`);
	}

	return /** @type {import('./BrandedUint8.js').BrandedUint8} */ (value);
}
