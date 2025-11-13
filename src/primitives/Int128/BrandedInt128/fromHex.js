import { BITS, MAX, MIN, MODULO } from "./constants.js";

/**
 * Create Int128 from hex string (two's complement)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./BrandedInt128.js').BrandedInt128} Int128 value
 * @throws {Error} If hex is invalid or out of range
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.fromHex("0x7fffffffffffffffffffffffffffffff"); // MAX
 * const b = Int128.fromHex("0x80000000000000000000000000000000"); // MIN
 * const c = Int128.fromHex("0xffffffffffffffffffffffffffffffff"); // -1
 * ```
 */
export function fromHex(hex) {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

	if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
		throw new Error(`Invalid hex string: ${hex}`);
	}

	// Parse as unsigned
	const unsigned = BigInt(`0x${cleanHex}`);

	// Convert from two's complement if high bit is set
	const highBit = 2n ** BigInt(BITS - 1);
	const value = unsigned >= highBit ? unsigned - MODULO : unsigned;

	if (value < MIN || value > MAX) {
		throw new Error(`Int128 value out of range (${MIN} to ${MAX}): ${value}`);
	}

	return value;
}
