/**
 * BLAKE2b compression round and mixing function
 */

import { MASK_64, SIGMA } from "./constants.js";
import { rotr64 } from "./u64.js";

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
	v[a] =
		/** @type {bigint} */ (v[a] + /** @type {bigint} */ (v[b]) + y) & MASK_64;
	v[d] = rotr64(
		/** @type {bigint} */ (v[d]) ^ /** @type {bigint} */ (v[a]),
		16,
	);
	v[c] = /** @type {bigint} */ (v[c] + /** @type {bigint} */ (v[d])) & MASK_64;
	v[b] = rotr64(
		/** @type {bigint} */ (v[b]) ^ /** @type {bigint} */ (v[c]),
		63,
	);
}

/**
 * BLAKE2b compression round
 * @param {bigint[]} v - Working vector
 * @param {bigint[]} m - Message block
 * @param {number} round - Round number
 */
export function blake2bRound(v, m, round) {
	const s = /** @type {number[]} */ (SIGMA[round % 12]);

	// Column mixing
	G(
		v,
		0,
		4,
		8,
		12,
		/** @type {bigint} */ (m[/** @type {number} */ (s[0])]),
		/** @type {bigint} */ (m[/** @type {number} */ (s[1])]),
	);
	G(
		v,
		1,
		5,
		9,
		13,
		/** @type {bigint} */ (m[/** @type {number} */ (s[2])]),
		/** @type {bigint} */ (m[/** @type {number} */ (s[3])]),
	);
	G(
		v,
		2,
		6,
		10,
		14,
		/** @type {bigint} */ (m[/** @type {number} */ (s[4])]),
		/** @type {bigint} */ (m[/** @type {number} */ (s[5])]),
	);
	G(
		v,
		3,
		7,
		11,
		15,
		/** @type {bigint} */ (m[/** @type {number} */ (s[6])]),
		/** @type {bigint} */ (m[/** @type {number} */ (s[7])]),
	);

	// Diagonal mixing
	G(
		v,
		0,
		5,
		10,
		15,
		/** @type {bigint} */ (m[/** @type {number} */ (s[8])]),
		/** @type {bigint} */ (m[/** @type {number} */ (s[9])]),
	);
	G(
		v,
		1,
		6,
		11,
		12,
		/** @type {bigint} */ (m[/** @type {number} */ (s[10])]),
		/** @type {bigint} */ (m[/** @type {number} */ (s[11])]),
	);
	G(
		v,
		2,
		7,
		8,
		13,
		/** @type {bigint} */ (m[/** @type {number} */ (s[12])]),
		/** @type {bigint} */ (m[/** @type {number} */ (s[13])]),
	);
	G(
		v,
		3,
		4,
		9,
		14,
		/** @type {bigint} */ (m[/** @type {number} */ (s[14])]),
		/** @type {bigint} */ (m[/** @type {number} */ (s[15])]),
	);
}
