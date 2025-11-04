import { blake3 } from "@noble/hashes/blake3.js";

/**
 * Hash internal node (left || right)
 * If both children are zero, parent hash is zero
 *
 * @param {Uint8Array} l - Left child hash (32 bytes)
 * @param {Uint8Array} r - Right child hash (32 bytes)
 * @returns {Uint8Array} Parent hash (32 bytes)
 *
 * @example
 * ```typescript
 * const left = new Uint8Array(32);
 * const right = new Uint8Array(32);
 * const hash = BinaryTree.hashInternal(left, right);
 * console.log(hash.every(b => b === 0)); // true (both zero)
 * ```
 */
export function hashInternal(l, r) {
	const lz = l.every((b) => b === 0);
	const rz = r.every((b) => b === 0);
	if (lz && rz) return new Uint8Array(32);

	return blake3(new Uint8Array([...l, ...r]));
}
