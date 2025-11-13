/**
 * Factory: Hash leaf node value
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.blake3 - BLAKE3 hash function
 * @returns {(node: import('./BrandedBinaryTree.js').LeafNode) => Uint8Array} Function that hashes leaf node
 *
 * @example
 * ```typescript
 * import { HashLeaf } from '@tevm/voltaire/BinaryTree'
 * import { blake3 } from '@noble/hashes/blake3'
 *
 * const hashLeaf = HashLeaf({ blake3 })
 * const value = new Uint8Array(32);
 * value[0] = 0x42;
 * const node = { type: 'leaf', value };
 * const hash = hashLeaf(node);
 * ```
 */
export function HashLeaf({ blake3 }) {
	return function hashLeaf(node) {
		return blake3(node.value);
	};
}
