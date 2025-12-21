import { blake3 } from "@noble/hashes/blake3.js";
import { InvalidTreeStateError } from "./errors.js";
import { getStemBit } from "./getStemBit.js";
import { HashNode } from "./hashNode.js";
import { splitKey } from "./splitKey.js";

const hashNode = HashNode({ blake3 });

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

/** @param {*} node @param {Uint8Array} stem @param {number} idx @param {*} v @param {number} depth */
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
			// Internal nodes in a Merkle tree only store hashes
			// We cannot traverse them, so we cannot insert into a tree with internal root
			// This is a limitation of the current implementation
			throw new InvalidTreeStateError(
				"Cannot insert into tree with internal node at this depth - tree structure limitation",
				{
					value: "internal",
					expected: "empty or stem",
					docsPath: "/primitives/binary-tree/insert#limitations",
				},
			);
		}
		case "leaf":
			throw new InvalidTreeStateError("Cannot insert into leaf node", {
				value: "leaf",
				expected: "empty, stem, or internal",
				docsPath: "/primitives/binary-tree/insert#error-handling",
			});
	}
}

/** @param {*} existing @param {Uint8Array} newStem @param {number} newIdx @param {*} newVal @param {number} depth */
function splitStems(existing, newStem, newIdx, newVal, depth) {
	// If we've checked all stem bits (248), stems must be equal
	// Update the value in the existing stem node
	if (depth >= 248) {
		const values = [...existing.values];
		values[newIdx] = newVal;
		return { type: "stem", stem: existing.stem, values };
	}

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
	const newStemNode = {
		type: "stem",
		stem: newStem,
		values: newValues,
	};

	const existingHash = hashNode(existing);
	const newHash = hashNode(newStemNode);

	if (existingBit === 0) {
		return { type: "internal", left: existingHash, right: newHash };
	}
	return { type: "internal", left: newHash, right: existingHash };
}

/** @param {Uint8Array} a @param {Uint8Array} b */
function arraysEqual(a, b) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}
