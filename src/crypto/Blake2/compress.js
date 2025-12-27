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

// BLAKE2b initialization vectors
const IV = [
	0x6a09e667f3bcc908n,
	0xbb67ae8584caa73bn,
	0x3c6ef372fe94f82bn,
	0xa54ff53a5f1d36f1n,
	0x510e527fade682d1n,
	0x9b05688c2b3e6c1fn,
	0x1f83d9abfb41bd6bn,
	0x5be0cd19137e2179n,
];

// BLAKE2b message schedule (sigma) - 12 rounds of permutations
const SIGMA = [
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
	[14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
	[11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
	[7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
	[9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
	[2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
	[12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
	[13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
	[6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
	[10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
	[14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
];

const MASK_64 = (1n << 64n) - 1n;

/**
 * Right rotation for 64-bit values
 * @param {bigint} x - Value to rotate
 * @param {number} n - Number of bits to rotate
 * @returns {bigint} Rotated value
 */
function rotr64(x, n) {
	return ((x >> BigInt(n)) | (x << BigInt(64 - n))) & MASK_64;
}

/**
 * BLAKE2b mixing function G
 * @param {bigint[]} v - Working vector (16 u64 values)
 * @param {number} a - Index a
 * @param {number} b - Index b
 * @param {number} c - Index c
 * @param {number} d - Index d
 * @param {bigint} x - Message word x
 * @param {bigint} y - Message word y
 */
function G(v, a, b, c, d, x, y) {
	const va = /** @type {bigint} */ (v[a]);
	const vb = /** @type {bigint} */ (v[b]);
	const vc = /** @type {bigint} */ (v[c]);
	const vd = /** @type {bigint} */ (v[d]);
	v[a] = (va + vb + x) & MASK_64;
	v[d] = rotr64(vd ^ /** @type {bigint} */ (v[a]), 32);
	v[c] = (vc + /** @type {bigint} */ (v[d])) & MASK_64;
	v[b] = rotr64(vb ^ /** @type {bigint} */ (v[c]), 24);
	v[a] = (/** @type {bigint} */ (v[a]) + /** @type {bigint} */ (v[b]) + y) & MASK_64;
	v[d] = rotr64(/** @type {bigint} */ (v[d]) ^ /** @type {bigint} */ (v[a]), 16);
	v[c] = (/** @type {bigint} */ (v[c]) + /** @type {bigint} */ (v[d])) & MASK_64;
	v[b] = rotr64(/** @type {bigint} */ (v[b]) ^ /** @type {bigint} */ (v[c]), 63);
}

/**
 * BLAKE2b compression round
 * @param {bigint[]} v - Working vector
 * @param {bigint[]} m - Message block
 * @param {number} round - Round number
 */
function blake2bRound(v, m, round) {
	const s = /** @type {number[]} */ (SIGMA[round % 12]);

	// Column mixing
	G(v, 0, 4, 8, 12, /** @type {bigint} */ (m[/** @type {number} */ (s[0])]), /** @type {bigint} */ (m[/** @type {number} */ (s[1])]));
	G(v, 1, 5, 9, 13, /** @type {bigint} */ (m[/** @type {number} */ (s[2])]), /** @type {bigint} */ (m[/** @type {number} */ (s[3])]));
	G(v, 2, 6, 10, 14, /** @type {bigint} */ (m[/** @type {number} */ (s[4])]), /** @type {bigint} */ (m[/** @type {number} */ (s[5])]));
	G(v, 3, 7, 11, 15, /** @type {bigint} */ (m[/** @type {number} */ (s[6])]), /** @type {bigint} */ (m[/** @type {number} */ (s[7])]));

	// Diagonal mixing
	G(v, 0, 5, 10, 15, /** @type {bigint} */ (m[/** @type {number} */ (s[8])]), /** @type {bigint} */ (m[/** @type {number} */ (s[9])]));
	G(v, 1, 6, 11, 12, /** @type {bigint} */ (m[/** @type {number} */ (s[10])]), /** @type {bigint} */ (m[/** @type {number} */ (s[11])]));
	G(v, 2, 7, 8, 13, /** @type {bigint} */ (m[/** @type {number} */ (s[12])]), /** @type {bigint} */ (m[/** @type {number} */ (s[13])]));
	G(v, 3, 4, 9, 14, /** @type {bigint} */ (m[/** @type {number} */ (s[14])]), /** @type {bigint} */ (m[/** @type {number} */ (s[15])]));
}

/**
 * Read a little-endian 64-bit unsigned integer from bytes
 * @param {Uint8Array} data - Byte array
 * @param {number} offset - Offset in bytes
 * @returns {bigint} 64-bit value
 */
function readU64LE(data, offset) {
	let result = 0n;
	for (let i = 0; i < 8; i++) {
		result |= BigInt(/** @type {number} */ (data[offset + i])) << BigInt(i * 8);
	}
	return result;
}

/**
 * Write a little-endian 64-bit unsigned integer to bytes
 * @param {Uint8Array} data - Byte array
 * @param {number} offset - Offset in bytes
 * @param {bigint} value - 64-bit value
 */
function writeU64LE(data, offset, value) {
	for (let i = 0; i < 8; i++) {
		data[offset + i] = Number((value >> BigInt(i * 8)) & 0xffn);
	}
}

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
		((/** @type {number} */ (input[0]) << 24) | (/** @type {number} */ (input[1]) << 16) | (/** @type {number} */ (input[2]) << 8) | /** @type {number} */ (input[3])) >>> 0;

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
		v[14] = ~/** @type {bigint} */ (v[14]) & MASK_64;
	}

	// Perform compression rounds
	for (let round = 0; round < rounds; round++) {
		blake2bRound(v, m, round);
	}

	// Finalize state
	for (let i = 0; i < 8; i++) {
		h[i] = (/** @type {bigint} */ (h[i]) ^ /** @type {bigint} */ (v[i]) ^ /** @type {bigint} */ (v[i + 8])) & MASK_64;
	}

	// Write output (64 bytes, 8x u64 little-endian)
	const output = new Uint8Array(64);
	for (let i = 0; i < 8; i++) {
		writeU64LE(output, i * 8, /** @type {bigint} */ (h[i]));
	}

	return output;
}

export default compress;
