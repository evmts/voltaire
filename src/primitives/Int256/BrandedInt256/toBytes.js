import { MODULO, SIZE } from "./constants.js";

/**
 * Convert Int256 to bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./BrandedInt256.js').BrandedInt256} value - Int256 value
 * @returns {Uint8Array} Byte array (32 bytes)
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-1n);
 * const bytes = Int256.toBytes(a); // [0xff, 0xff, ..., 0xff]
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
