import { BITS, MODULO, SIZE } from "./constants.js";

/**
 * Convert Int256 to hex string (two's complement)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Int256 value
 * @returns {string} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-1n);
 * Int256.toHex(a); // "0xffffffffffffffffffffffffffffffff"
 * const b = Int256.from(255n);
 * Int256.toHex(b); // "0x000000000000000000000000000000ff"
 * ```
 */
export function toHex(value) {
	// Convert to two's complement if negative
	const unsigned = value < 0n ? value + MODULO : value;

	// Convert to hex and pad to SIZE bytes
	const hex = unsigned.toString(16).padStart(SIZE * 2, "0");

	return `0x${hex}`;
}
