/**
 * Factory: Hash internal node (left || right)
 * If both children are zero, parent hash is zero
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.blake3 - BLAKE3 hash function
 * @returns {(l: Uint8Array, r: Uint8Array) => Uint8Array} Function that hashes internal node
 *
 * @example
 * ```typescript
 * import { HashInternal } from '@tevm/voltaire/BinaryTree'
 * import { blake3 } from '@noble/hashes/blake3'
 *
 * const hashInternal = HashInternal({ blake3 })
 * const left = new Uint8Array(32);
 * const right = new Uint8Array(32);
 * const hash = hashInternal(left, right);
 * console.log(hash.every(b => b === 0)); // true (both zero)
 * ```
 */
export function HashInternal({ blake3 }) {
	return function hashInternal(l, r) {
		const lz = l.every((b) => b === 0);
		const rz = r.every((b) => b === 0);
		if (lz && rz) return new Uint8Array(32);

		return blake3(new Uint8Array([...l, ...r]));
	};
}
