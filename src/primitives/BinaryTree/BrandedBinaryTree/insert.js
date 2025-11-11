import { InvalidTreeStateError } from "./errors.js";
import { getStemBit } from "./getStemBit.js";
import { hashNode } from "./hashNode.js";
import { splitKey } from "./splitKey.js";

/**
 * Insert value at key
 *
 * @param {import('./BrandedBinaryTree.js').BinaryTree} tree - Binary tree
 * @param {Uint8Array} k - 32-byte key
 * @param {Uint8Array} v - Value to insert
 * @returns {import('./BrandedBinaryTree.js').BinaryTree} Updated tree
 * @throws {InvalidKeyLengthError} If key is not 32 bytes
 * @throws {InvalidTreeStateError} If tree is in invalid state
 *
 * @example
 * ```typescript
 * let tree = BinaryTree.init();
 * const key = new Uint8Array(32);
 * const value = new Uint8Array(32);
 * tree = BinaryTree.insert(tree, key, value);
 * ```
 */
export function insert(tree, k, v) {
	const { stem, idx } = splitKey(k);
	const root = insertNode(tree.root, stem, idx, v, 0);
	return { root };
}

/**
 * @param {import('./BrandedBinaryTree.js').Node} node
 * @param {Uint8Array} stem
 * @param {number} idx
 * @param {Uint8Array} v
 * @param {number} depth
 * @returns {import('./BrandedBinaryTree.js').Node}
 */
function insertNode(node, stem, idx, v, depth) {
	switch (node.type) {
		case "empty": {
			const values = new Array(256).fill(null);
			values[idx] = v;
			return { type: "stem", stem, values };
		}
		case "stem": {
			if (arraysEqual(node.stem, stem)) {
				const values = [...node.values];
				values[idx] = v;
				return { type: "stem", stem, values };
			}
			return splitStems(node, stem, idx, v, depth);
		}
		case "internal": {
			const bit = getStemBit(stem, depth);
			if (bit === 0) {
				const newLeft = insertNode(
					{ type: "internal", left: node.left, right: node.right },
					stem,
					idx,
					v,
					depth + 1,
				);
				return { type: "internal", left: hashNode(newLeft), right: node.right };
			}
			const newRight = insertNode(
				{ type: "internal", left: node.left, right: node.right },
				stem,
				idx,
				v,
				depth + 1,
			);
			return { type: "internal", left: node.left, right: hashNode(newRight) };
		}
		case "leaf":
			throw new InvalidTreeStateError("Cannot insert into leaf node", {
				value: "leaf",
				expected: "empty, stem, or internal",
				docsPath: "/primitives/binary-tree/insert#error-handling",
			});
	}
}

/**
 * @param {import('./BrandedBinaryTree.js').StemNode} existing
 * @param {Uint8Array} newStem
 * @param {number} newIdx
 * @param {Uint8Array} newVal
 * @param {number} depth
 * @returns {import('./BrandedBinaryTree.js').Node}
 */
function splitStems(existing, newStem, newIdx, newVal, depth) {
	const existingBit = getStemBit(existing.stem, depth);
	const newBit = getStemBit(newStem, depth);

	if (existingBit === newBit) {
		const child = splitStems(existing, newStem, newIdx, newVal, depth + 1);
		const childHash = hashNode(child);

		if (existingBit === 0) {
			return { type: "internal", left: childHash, right: new Uint8Array(32) };
		}
		return { type: "internal", left: new Uint8Array(32), right: childHash };
	}

	const newValues = new Array(256).fill(null);
	newValues[newIdx] = newVal;
	const newStemNode =
		/** @type {import('./BrandedBinaryTree.js').StemNode} */ ({
			type: "stem",
			stem: newStem,
			values: newValues,
		});

	const existingHash = hashNode(existing);
	const newHash = hashNode(newStemNode);

	if (existingBit === 0) {
		return { type: "internal", left: existingHash, right: newHash };
	}
	return { type: "internal", left: newHash, right: existingHash };
}

/**
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function arraysEqual(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
