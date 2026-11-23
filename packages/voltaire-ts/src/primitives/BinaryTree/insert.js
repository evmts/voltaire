import { blake3 } from "@noble/hashes/blake3.js";
import { InvalidTreeStateError } from "./errors.js";
import { getStemBit } from "./getStemBit.js";
import { HashNode } from "./hashNode.js";
import { resolveChild } from "./resolveChild.js";
import { splitKey } from "./splitKey.js";

const hashNode = HashNode({ blake3 });

/** @type {import('./BinaryTreeType.js').EmptyNode} */
const EMPTY = { type: "empty" };

/**
 * Insert value at key
 * @param {*} tree
 * @param {Uint8Array} k
 * @param {*} v
 */
export function insert(tree, k, v) {
	const { stem, idx } = splitKey(k);
	const root = insertNode(tree.root, stem, idx, v, 0);
	return { root };
}

/** @param {import('./BinaryTreeType.js').Node} node @param {Uint8Array} stem @param {number} idx @param {*} v @param {number} depth @returns {import('./BinaryTreeType.js').Node} */
function insertNode(node, stem, idx, v, depth) {
	// Prevent infinite recursion by checking depth limit
	if (depth > 300) {
		throw new InvalidTreeStateError(
			"Maximum tree depth exceeded - possible infinite recursion",
			{
				value: depth,
				expected: "<= 300",
				docsPath: "/primitives/binary-tree/insert#error-handling",
			},
		);
	}

	switch (node.type) {
		case "empty": {
			const values = new Array(256).fill(null);
			values[idx] = v;
			return /** @type {import('./BinaryTreeType.js').StemNode} */ ({
				type: "stem",
				stem,
				values,
			});
		}
		case "stem": {
			if (arraysEqual(node.stem, stem)) {
				const values = [...node.values];
				values[idx] = v;
				return /** @type {import('./BinaryTreeType.js').StemNode} */ ({
					type: "stem",
					stem,
					values,
				});
			}
			return splitStems(node, stem, idx, v, depth);
		}
		case "internal": {
			const bit = getStemBit(stem, depth);
			const child = insertNode(
				resolveChild(node, bit),
				stem,
				idx,
				v,
				depth + 1,
			);
			if (bit === 0) {
				return internal(child, node.rightChild, undefined, node.right);
			}
			return internal(node.leftChild, child, node.left);
		}
		case "leaf":
			throw new InvalidTreeStateError("Cannot insert into leaf node", {
				value: "leaf",
				expected: "empty, stem, or internal",
				docsPath: "/primitives/binary-tree/insert#error-handling",
			});
	}
}

/** @param {import('./BinaryTreeType.js').StemNode} existing @param {Uint8Array} newStem @param {number} newIdx @param {*} newVal @param {number} depth @returns {import('./BinaryTreeType.js').Node} */
function splitStems(existing, newStem, newIdx, newVal, depth) {
	// If we've checked all stem bits (248), stems must be equal
	// Update the value in the existing stem node
	if (depth >= 248) {
		const values = [...existing.values];
		values[newIdx] = newVal;
		return /** @type {import('./BinaryTreeType.js').StemNode} */ ({
			type: "stem",
			stem: existing.stem,
			values,
		});
	}

	const existingBit = getStemBit(existing.stem, depth);
	const newBit = getStemBit(newStem, depth);

	if (existingBit === newBit) {
		const child = splitStems(existing, newStem, newIdx, newVal, depth + 1);
		if (existingBit === 0) {
			return internal(child, undefined);
		}
		return internal(undefined, child);
	}

	const newValues = new Array(256).fill(null);
	newValues[newIdx] = newVal;
	/** @type {import('./BinaryTreeType.js').StemNode} */
	const newStemNode = {
		type: "stem",
		stem: newStem,
		values: newValues,
	};

	if (existingBit === 0) {
		return internal(existing, newStemNode);
	}
	return internal(newStemNode, existing);
}

/**
 * Build an internal node that keeps its children and caches their hashes.
 * Pass a hash to reuse an unchanged side, including a pruned side that has
 * a hash but no child.
 *
 * @param {import('./BinaryTreeType.js').Node | undefined} leftChild
 * @param {import('./BinaryTreeType.js').Node | undefined} rightChild
 * @param {Uint8Array} [left] - Known left hash
 * @param {Uint8Array} [right] - Known right hash
 * @returns {import('./BinaryTreeType.js').InternalNode}
 */
function internal(leftChild, rightChild, left, right) {
	/** @type {{ type: "internal"; left: Uint8Array; right: Uint8Array; leftChild?: import('./BinaryTreeType.js').Node; rightChild?: import('./BinaryTreeType.js').Node }} */
	const node = {
		type: "internal",
		left: left ?? hashNode(leftChild ?? EMPTY),
		right: right ?? hashNode(rightChild ?? EMPTY),
	};
	if (leftChild) node.leftChild = leftChild;
	if (rightChild) node.rightChild = rightChild;
	return node;
}

/** @param {Uint8Array} a @param {Uint8Array} b */
function arraysEqual(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
