/**
 * BLAKE2b F compression function for EIP-152 precompile
 *
 * Implements the BLAKE2b compression function as specified in RFC 7693.
 * This is the low-level F function used by the EVM BLAKE2F precompile (0x09).
 *
 * Input format (213 bytes):
 * - rounds (4 bytes, big-endian)
 * - h (64 bytes, 8x u64 little-endian) - state vector
 * - m (128 bytes, 16x u64 little-endian) - message block
 * - t (16 bytes, 2x u64 little-endian) - offset counters
 * - f (1 byte) - final block flag (0 or 1)
 *
 * Output: 64 bytes (8x u64 little-endian) - updated state
 *
 * @see https://eips.ethereum.org/EIPS/eip-152
 * @see https://www.rfc-editor.org/rfc/rfc7693
 * @since 0.0.0
 */

import { IV, MASK_64 } from "./constants.js";
import { readU64LE, writeU64LE } from "./u64.js";
import { blake2bRound } from "./blake2bRound.js";

/**
 * BLAKE2b F compression function (EIP-152 format)
 *
 * @param {Uint8Array} input - 213-byte input in EIP-152 format
 * @returns {Uint8Array} 64-byte output (updated state)
 * @throws {Error} If input length is not 213 bytes
 *
 * @example
 * ```javascript
 * import { compress } from './crypto/Blake2/compress.js';
 *
 * const input = new Uint8Array(213);
 * // ... fill input with rounds, h, m, t, f
 * const output = compress(input);
 * ```
 */
export function compress(input) {
	if (input.length !== 213) {
		throw new Error(`Invalid input length: expected 213, got ${input.length}`);
	}

	// Parse rounds (4 bytes, big-endian) - use >>> 0 to force unsigned 32-bit interpretation
	const rounds =
		/** @type {number} */ (
			/** @type {number} */ (/** @type {number} */ (input[0]) << 24) |
				/** @type {number} */ (/** @type {number} */ (input[1]) << 16) |
				/** @type {number} */ (/** @type {number} */ (input[2]) << 8) |
				/** @type {number} */ (input[3])
		) >>> 0;

	// Parse h (64 bytes, 8x u64 little-endian)
	/** @type {bigint[]} */
	const h = [];
	for (let i = 0; i < 8; i++) {
		h.push(readU64LE(input, 4 + i * 8));
	}

	// Parse m (128 bytes, 16x u64 little-endian)
	/** @type {bigint[]} */
	const m = [];
	for (let i = 0; i < 16; i++) {
		m.push(readU64LE(input, 68 + i * 8));
	}

	// Parse t (16 bytes, 2x u64 little-endian)
	const t0 = readU64LE(input, 196);
	const t1 = readU64LE(input, 204);

	// Parse f (1 byte, boolean)
	const f = input[212] !== 0;

	// Initialize working vector
	/** @type {bigint[]} */
	const v = new Array(16);
	for (let i = 0; i < 8; i++) {
		v[i] = /** @type {bigint} */ (h[i]);
		v[i + 8] = /** @type {bigint} */ (IV[i]);
	}

	// Mix in offset counters
	v[12] = /** @type {bigint} */ (v[12]) ^ t0;
	v[13] = /** @type {bigint} */ (v[13]) ^ t1;

	// Mix in final block flag
	if (f) {
		v[14] = ~(/** @type {bigint} */ (v[14])) & MASK_64;
	}

	// Perform compression rounds
	for (let round = 0; round < rounds; round++) {
		blake2bRound(v, m, round);
	}

	// Finalize state
	for (let i = 0; i < 8; i++) {
		h[i] =
			/** @type {bigint} */ (
				/** @type {bigint} */ (h[i]) ^
					/** @type {bigint} */ (v[i]) ^
					/** @type {bigint} */ (v[i + 8])
			) & MASK_64;
	}

	// Write output (64 bytes, 8x u64 little-endian)
	const output = new Uint8Array(64);
	for (let i = 0; i < 8; i++) {
		writeU64LE(output, i * 8, /** @type {bigint} */ (h[i]));
	}

	return output;
}

export default compress;
