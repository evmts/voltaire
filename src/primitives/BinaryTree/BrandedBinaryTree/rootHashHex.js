import { rootHash } from "./rootHash.js";

/**
 * Convert root hash to hex string
 *
 * @param {import('./BrandedBinaryTree.js').BinaryTree} tree - Binary tree
 * @returns {import('../../Hex/BrandedHex/index.js').BrandedHex} Root hash as hex string
 *
 * @example
 * ```typescript
 * const tree = BinaryTree.init();
 * const hex = BinaryTree.rootHashHex(tree);
 * console.log(hex); // "0x0000...0000"
 * ```
 */
export function rootHashHex(tree) {
	const h = rootHash(tree);
	return /** @type {import('../../Hex/BrandedHex/index.js').BrandedHex} */ (
		`0x${Array.from(h)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`
	);
}
