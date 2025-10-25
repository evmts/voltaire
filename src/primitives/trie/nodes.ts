/**
 * Trie node encoding and decoding
 *
 * Implements RLP encoding for trie nodes as per Ethereum Yellow Paper.
 */

import type { Bytes, BranchNode, ExtensionNode, LeafNode, TrieNode } from "./types.js";
import { encode, decode, type RlpDecoded } from "../rlp.js";
import { keccak256 } from "../keccak.js";
import { encodeNibbles, decodeNibbles, type Nibbles } from "./nibbles.js";

/**
 * Create a leaf node
 */
export function createLeafNode(path: Nibbles, value: Bytes): LeafNode {
	return {
		type: "leaf",
		path,
		value,
	};
}

/**
 * Create an extension node
 */
export function createExtensionNode(path: Nibbles, child: Bytes): ExtensionNode {
	return {
		type: "extension",
		path,
		child,
	};
}

/**
 * Create a branch node
 */
export function createBranchNode(): BranchNode {
	return {
		type: "branch",
		children: Array(16).fill(null),
		value: null,
	};
}

/**
 * Encode a trie node to RLP bytes
 *
 * @param node - Node to encode
 * @returns RLP-encoded node bytes
 */
export function encodeNode(node: TrieNode): Bytes {
	if (node === null) {
		return encode(new Uint8Array(0));
	}

	switch (node.type) {
		case "leaf": {
			const path = encodeNibbles(node.path, true);
			return encode([path, node.value]);
		}

		case "extension": {
			const path = encodeNibbles(node.path, false);
			return encode([path, node.child]);
		}

		case "branch": {
			const items: (Bytes | Uint8Array)[] = [];
			for (const child of node.children) {
				items.push(child || new Uint8Array(0));
			}
			items.push(node.value || new Uint8Array(0));
			return encode(items);
		}
	}
}

/**
 * Decode RLP bytes to a trie node
 *
 * @param encoded - RLP-encoded node bytes
 * @returns Decoded node
 */
export function decodeNode(encoded: Bytes): TrieNode {
	if (encoded.length === 0) {
		return null;
	}

	const decoded = decode(encoded);

	// Empty string = null node
	if (decoded instanceof Uint8Array && decoded.length === 0) {
		return null;
	}

	// Must be a list
	if (!Array.isArray(decoded)) {
		throw new Error("Invalid node: expected list");
	}

	// Branch node: 17 items (16 children + value)
	if (decoded.length === 17) {
		const branch = createBranchNode();
		for (let i = 0; i < 16; i++) {
			const child = decoded[i];
			if (!(child instanceof Uint8Array)) {
				throw new Error("Invalid branch child");
			}
			branch.children[i] = child.length > 0 ? child : null;
		}
		const value = decoded[16];
		if (!(value instanceof Uint8Array)) {
			throw new Error("Invalid branch value");
		}
		branch.value = value.length > 0 ? value : null;
		return branch;
	}

	// Leaf or extension: 2 items [path, value/child]
	if (decoded.length === 2) {
		const pathEncoded = decoded[0];
		const second = decoded[1];

		if (!(pathEncoded instanceof Uint8Array) || !(second instanceof Uint8Array)) {
			throw new Error("Invalid leaf/extension node");
		}

		const { nibbles, isLeaf } = decodeNibbles(pathEncoded);

		if (isLeaf) {
			return createLeafNode(nibbles, second);
		}
		return createExtensionNode(nibbles, second);
	}

	throw new Error(`Invalid node: unexpected list length ${decoded.length}`);
}

/**
 * Hash a node
 *
 * If node is < 32 bytes, return the node itself (embedded).
 * Otherwise, return keccak256 hash of the node.
 *
 * @param node - Node to hash
 * @returns Hash or embedded node
 */
export function hashNode(node: TrieNode): Bytes {
	const encoded = encodeNode(node);
	if (encoded.length < 32) {
		return encoded;
	}
	return keccak256(encoded);
}

/**
 * Check if a hash is an embedded node (< 32 bytes)
 *
 * @param hash - Hash to check
 * @returns True if embedded
 */
export function isEmbeddedNode(hash: Bytes): boolean {
	return hash.length < 32;
}

/**
 * Get node reference for storage
 *
 * For nodes >= 32 bytes, returns hash.
 * For smaller nodes, returns the node itself (embedded).
 *
 * @param node - Node to get reference for
 * @returns Node reference
 */
export function getNodeReference(node: TrieNode): Bytes {
	return hashNode(node);
}

/**
 * Check if node is a branch
 */
export function isBranchNode(node: TrieNode): node is BranchNode {
	return node !== null && node.type === "branch";
}

/**
 * Check if node is an extension
 */
export function isExtensionNode(node: TrieNode): node is ExtensionNode {
	return node !== null && node.type === "extension";
}

/**
 * Check if node is a leaf
 */
export function isLeafNode(node: TrieNode): node is LeafNode {
	return node !== null && node.type === "leaf";
}
