import { MAX } from "./constants.js";

/**
 * Create Uint64 from hex string
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {string} hex - hex string (with or without 0x prefix)
 * @returns {import('./BrandedUint64.js').BrandedUint64} Uint64 value
 * @throws {Error} If value is out of range or invalid hex
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.fromHex("0xffffffffffffffff");
 * const b = Uint64.fromHex("ff");
 * ```
 */
export function fromHex(hex) {
	if (typeof hex !== "string") {
		throw new Error(`Uint64.fromHex requires string, got ${typeof hex}`);
	}

	const value = BigInt(hex.startsWith("0x") ? hex : `0x${hex}`);

	if (value < 0n) {
		throw new Error(`Uint64 value cannot be negative: ${value}`);
	}

	if (value > MAX) {
		throw new Error(`Uint64 value exceeds maximum: ${value}`);
	}

	return value;
}
