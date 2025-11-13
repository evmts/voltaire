import { BITS, MODULO, SIZE } from "./constants.js";

/**
 * Convert Int128 to hex string (two's complement)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Int128 value
 * @returns {string} Hex string with 0x prefix
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-1n);
 * Int128.toHex(a); // "0xffffffffffffffffffffffffffffffff"
 * const b = Int128.from(255n);
 * Int128.toHex(b); // "0x000000000000000000000000000000ff"
 * ```
 */
export function toHex(value) {
	// Convert to two's complement if negative
	const unsigned = value < 0n ? value + MODULO : value;

	// Convert to hex and pad to SIZE bytes
	const hex = unsigned.toString(16).padStart(SIZE * 2, "0");

	return `0x${hex}`;
}
