import { MODULO, SIZE } from "./constants.js";

/**
 * Convert Int128 to bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt128.js').BrandedInt128} value - Int128 value
 * @returns {Uint8Array} Byte array (16 bytes)
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-1n);
 * const bytes = Int128.toBytes(a); // [0xff, 0xff, ..., 0xff]
 * ```
 */
export function toBytes(value) {
	// Convert to two's complement if negative
	const unsigned = value < 0n ? value + MODULO : value;

	const bytes = new Uint8Array(SIZE);
	let temp = unsigned;

	// Fill from right to left (big-endian)
	for (let i = SIZE - 1; i >= 0; i--) {
		bytes[i] = Number(temp & 0xffn);
		temp >>= 8n;
	}

	return bytes;
}
