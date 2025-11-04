import { blake3 } from "@noble/hashes/blake3.js";

/**
 * Hash leaf node value
 *
 * @param {import('./BrandedBinaryTree.js').LeafNode} node - Leaf node
 * @returns {Uint8Array} Hash (32 bytes)
 *
 * @example
 * ```typescript
 * const value = new Uint8Array(32);
 * value[0] = 0x42;
 * const node = { type: 'leaf', value };
 * const hash = BinaryTree.hashLeaf(node);
 * ```
 */
export function hashLeaf(node) {
	return blake3(node.value);
}
