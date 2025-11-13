import { MAX } from "./constants.js";

/**
 * Create Uint32 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./BrandedUint32.js').BrandedUint32} Uint32 value
 * @throws {Error} If value is out of range or invalid hex
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.fromHex("0xff");
 * const b = Uint32.fromHex("ff");
 * ```
 */
export function fromHex(hex) {
	if (typeof hex !== "string") {
		throw new Error(`Uint32.fromHex requires string, got ${typeof hex}`);
	}

	const value = BigInt(hex.startsWith("0x") ? hex : `0x${hex}`);

	if (value < 0n) {
		throw new Error(`Uint32 value cannot be negative: ${value}`);
	}

	if (value > BigInt(MAX)) {
		throw new Error(`Uint32 value exceeds maximum: ${value}`);
	}

	return Number(value);
}
