import { BITS, MAX, MIN, MODULO, SIZE } from "./constants.js";

/**
 * Create Int128 from bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Byte array (16 bytes)
 * @returns {import('./BrandedInt128.js').BrandedInt128} Int128 value
 * @throws {Error} If bytes length is incorrect
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const bytes = new Uint8Array(16);
 * bytes[15] = 0xff; // -1
 * const value = Int128.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new Error(`Int128 requires ${SIZE} bytes, got ${bytes.length}`);
	}

	// Parse as unsigned
	let unsigned = 0n;
	for (let i = 0; i < SIZE; i++) {
		unsigned = (unsigned << 8n) | BigInt(bytes[i]);
	}

	// Convert from two's complement if high bit is set
	const highBit = 2n ** BigInt(BITS - 1);
	const value = unsigned >= highBit ? unsigned - MODULO : unsigned;

	if (value < MIN || value > MAX) {
		throw new Error(
			`Int128 value out of range (${MIN} to ${MAX}): ${value}`,
		);
	}

	return value;
}
