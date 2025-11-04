import { blake3 } from "@noble/hashes/blake3.js";

/**
 * Hash stem node (stem || value1 || value2 || ... || value256)
 *
 * @param {import('./BrandedBinaryTree.js').StemNode} node - Stem node
 * @returns {Uint8Array} Hash (32 bytes)
 *
 * @example
 * ```typescript
 * const stem = new Uint8Array(31);
 * const values = new Array(256).fill(null);
 * values[0] = new Uint8Array(32);
 * const node = { type: 'stem', stem, values };
 * const hash = BinaryTree.hashStem(node);
 * ```
 */
export function hashStem(node) {
	const data = [...node.stem];
	for (const v of node.values) {
		if (v) {
			data.push(...v);
		} else {
			data.push(...new Array(32).fill(0));
		}
	}
	return blake3(new Uint8Array(data));
}
