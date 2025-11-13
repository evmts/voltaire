import { MAX } from "./constants.js";

/**
 * Create Uint16 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./BrandedUint16.js').BrandedUint16} Uint16 value
 * @throws {Error} If hex is invalid or out of range
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.fromHex("0xffff");
 * const b = Uint16.fromHex("ffff");
 * ```
 */
export function fromHex(hex) {
	const cleanHex = hex.startsWith("0x") || hex.startsWith("0X") ? hex : `0x${hex}`;
	const value = Number.parseInt(cleanHex, 16);

	if (Number.isNaN(value)) {
		throw new Error(`Invalid hex string: ${hex}`);
	}

	if (value < 0) {
		throw new Error(`Uint16 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint16 value exceeds maximum (65535): ${value}`);
	}

	return /** @type {import('./BrandedUint16.js').BrandedUint16} */ (value);
}
