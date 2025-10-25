/**
 * Merkle Patricia Trie implementation
 *
 * Implements Ethereum's Modified Merkle Patricia Trie as specified in
 * the Yellow Paper (Appendix D).
 */

import type { Bytes, Trie, TrieDB, TrieNode, TrieOptions, Checkpoint, Proof } from "./types.js";
import { MemoryDB } from "./db.js";
import { bytesToNibbles, commonPrefixLength, type Nibbles } from "./nibbles.js";
import {
	createBranchNode,
	createExtensionNode,
	createLeafNode,
	decodeNode,
	encodeNode,
	hashNode,
	isBranchNode,
	isEmbeddedNode,
	isExtensionNode,
	isLeafNode,
} from "./nodes.js";
import { bytesToHex } from "../hex.js";

/**
 * Create a new Merkle Patricia Trie
 *
 * @param options - Trie options
 * @returns New trie instance
 */
export async function create(options?: TrieOptions): Promise<Trie> {
	const db = options?.db || new MemoryDB();
	const root = options?.root || null;
	const useCheckpoints = options?.useCheckpoints ?? false;

	return new TrieImpl(db, root, useCheckpoints);
}

class TrieImpl implements Trie {
	private db: TrieDB;
	private _root: Bytes | null;
	private useCheckpoints: boolean;
	private checkpoints: Checkpoint[] = [];

	constructor(db: TrieDB, root: Bytes | null, useCheckpoints: boolean) {
		this.db = db;
		this._root = root;
		this.useCheckpoints = useCheckpoints;
	}

	get root(): Bytes | null {
		return this._root;
	}

	/**
	 * Get value for a key
	 */
	async get(key: Bytes): Promise<Bytes | null> {
		if (this._root === null) return null;

		const nibbles = bytesToNibbles(key);
		return await this.getNode(this._root, nibbles);
	}

	/**
	 * Put key-value pair
	 */
	async put(key: Bytes, value: Bytes): Promise<void> {
		const nibbles = bytesToNibbles(key);

		if (this._root === null) {
			// Empty trie - create leaf
			const leaf = createLeafNode(nibbles, value);
			this._root = await this.saveNode(leaf);
		} else {
			// Update existing trie
			this._root = await this.putNode(this._root, nibbles, value);
		}
	}

	/**
	 * Delete a key
	 */
	async del(key: Bytes): Promise<void> {
		if (this._root === null) return;

		const nibbles = bytesToNibbles(key);
		this._root = await this.deleteNode(this._root, nibbles);
	}

	/**
	 * Commit changes and return root hash
	 */
	async commit(): Promise<Bytes | null> {
		return this._root;
	}

	/**
	 * Create a checkpoint for revert
	 */
	checkpoint(): void {
		if (!this.useCheckpoints) {
			throw new Error("Checkpoints not enabled");
		}

		this.checkpoints.push({
			root: this._root,
			db: new Map(),
		});
	}

	/**
	 * Revert to last checkpoint
	 */
	revert(): void {
		if (!this.useCheckpoints) {
			throw new Error("Checkpoints not enabled");
		}

		const checkpoint = this.checkpoints.pop();
		if (!checkpoint) {
			throw new Error("No checkpoint to revert to");
		}

		this._root = checkpoint.root;
	}

	/**
	 * Create Merkle proof for a key
	 */
	async createProof(key: Bytes): Promise<Proof> {
		const proof: Proof = [];
		if (this._root === null) return proof;

		const nibbles = bytesToNibbles(key);
		await this.buildProof(this._root, nibbles, proof);
		return proof;
	}

	/**
	 * Verify Merkle proof
	 */
	async verifyProof(root: Bytes, key: Bytes, proof: Proof): Promise<Bytes | null> {
		if (proof.length === 0) return null;

		let nibbles = bytesToNibbles(key);
		let currentHash = root;

		for (const proofNode of proof) {
			// Verify hash matches
			const calculatedHash = hashNode(decodeNode(proofNode.data));
			if (bytesToHex(calculatedHash) !== bytesToHex(proofNode.hash)) {
				throw new Error("Invalid proof: hash in proof mismatch");
			}

			const node = decodeNode(proofNode.data);
			if (node === null) return null;

			if (isLeafNode(node)) {
				if (nibbles.length === node.path.length && nibbles.every((n, i) => n === node.path[i])) {
					return node.value;
				}
				return null;
			}

			if (isExtensionNode(node)) {
				if (nibbles.length < node.path.length) return null;
				if (!node.path.every((n, i) => n === nibbles[i])) return null;
				nibbles = nibbles.slice(node.path.length);
				currentHash = node.child;
				continue;
			}

			if (isBranchNode(node)) {
				if (nibbles.length === 0) return node.value;
				const nibble = nibbles[0]!;
				const child = node.children[nibble];
				if (!child) return null;
				nibbles = nibbles.slice(1);
				currentHash = child;
				continue;
			}
		}

		return null;
	}

	/**
	 * Copy the trie
	 */
	copy(): Trie {
		return new TrieImpl(this.db, this._root, this.useCheckpoints);
	}

	// Internal methods

	private async getNode(nodeRef: Bytes, nibbles: Nibbles): Promise<Bytes | null> {
		const node = await this.loadNode(nodeRef);
		if (node === null) return null;

		if (isLeafNode(node)) {
			if (nibbles.length === node.path.length && nibbles.every((n, i) => n === node.path[i])) {
				return node.value;
			}
			return null;
		}

		if (isExtensionNode(node)) {
			if (nibbles.length < node.path.length) return null;
			if (!node.path.every((n, i) => n === nibbles[i])) return null;

			const remaining = nibbles.slice(node.path.length);
			return await this.getNode(node.child, remaining);
		}

		if (isBranchNode(node)) {
			if (nibbles.length === 0) return node.value;

			const nibble = nibbles[0]!;
			const child = node.children[nibble];
			if (!child) return null;

			const remaining = nibbles.slice(1);
			return await this.getNode(child, remaining);
		}

		return null;
	}

	private async putNode(nodeRef: Bytes, nibbles: Nibbles, value: Bytes): Promise<Bytes> {
		const node = await this.loadNode(nodeRef);
		if (node === null) {
			// Replace null with leaf
			const leaf = createLeafNode(nibbles, value);
			return await this.saveNode(leaf);
		}

		if (isLeafNode(node)) {
			// Check if same path
			if (nibbles.length === node.path.length && nibbles.every((n, i) => n === node.path[i])) {
				// Update value
				const newLeaf = createLeafNode(node.path, value);
				return await this.saveNode(newLeaf);
			}

			// Split into branch
			return await this.splitLeaf(node, nibbles, value);
		}

		if (isExtensionNode(node)) {
			const commonLen = commonPrefixLength(node.path, nibbles);

			if (commonLen === node.path.length) {
				// Extension path is prefix of key
				const remaining = nibbles.slice(commonLen);
				const newChild = await this.putNode(node.child, remaining, value);
				const newExt = createExtensionNode(node.path, newChild);
				return await this.saveNode(newExt);
			}

			// Split extension
			return await this.splitExtension(node, nibbles, value, commonLen);
		}

		if (isBranchNode(node)) {
			if (nibbles.length === 0) {
				// Update branch value
				const newBranch = createBranchNode();
				newBranch.children = [...node.children];
				newBranch.value = value;
				return await this.saveNode(newBranch);
			}

			const nibble = nibbles[0]!;
			const remaining = nibbles.slice(1);

			const newBranch = createBranchNode();
			newBranch.children = [...node.children];
			newBranch.value = node.value;

			if (node.children[nibble]) {
				newBranch.children[nibble] = await this.putNode(node.children[nibble]!, remaining, value);
			} else {
				const leaf = createLeafNode(remaining, value);
				newBranch.children[nibble] = await this.saveNode(leaf);
			}

			return await this.saveNode(newBranch);
		}

		throw new Error("Invalid node type");
	}

	private async deleteNode(nodeRef: Bytes, nibbles: Nibbles): Promise<Bytes | null> {
		const node = await this.loadNode(nodeRef);
		if (node === null) return null;

		if (isLeafNode(node)) {
			if (nibbles.length === node.path.length && nibbles.every((n, i) => n === node.path[i])) {
				return null; // Delete this leaf
			}
			return nodeRef; // Key not found
		}

		if (isExtensionNode(node)) {
			if (nibbles.length < node.path.length) return nodeRef;
			if (!node.path.every((n, i) => n === nibbles[i])) return nodeRef;

			const remaining = nibbles.slice(node.path.length);
			const newChild = await this.deleteNode(node.child, remaining);

			if (newChild === null) return null;
			const newExt = createExtensionNode(node.path, newChild);
			return await this.saveNode(newExt);
		}

		if (isBranchNode(node)) {
			if (nibbles.length === 0) {
				// Delete branch value
				const newBranch = createBranchNode();
				newBranch.children = [...node.children];
				newBranch.value = null;

				// Check if branch should collapse
				const nonNullChildren = newBranch.children.filter((c) => c !== null);
				if (nonNullChildren.length === 0) return null;

				return await this.saveNode(newBranch);
			}

			const nibble = nibbles[0]!;
			if (!node.children[nibble]) return nodeRef;

			const remaining = nibbles.slice(1);
			const newChild = await this.deleteNode(node.children[nibble]!, remaining);

			const newBranch = createBranchNode();
			newBranch.children = [...node.children];
			newBranch.children[nibble] = newChild;
			newBranch.value = node.value;

			// Check if branch should collapse
			const nonNullChildren = newBranch.children.filter((c) => c !== null);
			if (nonNullChildren.length === 0 && newBranch.value === null) {
				return null;
			}

			return await this.saveNode(newBranch);
		}

		throw new Error("Invalid node type");
	}

	private async splitLeaf(leaf: LeafNode, newNibbles: Nibbles, newValue: Bytes): Promise<Bytes> {
		const commonLen = commonPrefixLength(leaf.path, newNibbles);
		const branch = createBranchNode();

		if (commonLen === leaf.path.length) {
			// Existing leaf becomes branch value
			branch.value = leaf.value;

			// New value goes into child
			const newLeaf = createLeafNode(newNibbles.slice(commonLen + 1), newValue);
			branch.children[newNibbles[commonLen]!] = await this.saveNode(newLeaf);
		} else if (commonLen === newNibbles.length) {
			// New value becomes branch value
			branch.value = newValue;

			// Existing leaf goes into child
			const oldLeaf = createLeafNode(leaf.path.slice(commonLen + 1), leaf.value);
			branch.children[leaf.path[commonLen]!] = await this.saveNode(oldLeaf);
		} else {
			// Both become children
			const oldLeaf = createLeafNode(leaf.path.slice(commonLen + 1), leaf.value);
			branch.children[leaf.path[commonLen]!] = await this.saveNode(oldLeaf);

			const newLeaf = createLeafNode(newNibbles.slice(commonLen + 1), newValue);
			branch.children[newNibbles[commonLen]!] = await this.saveNode(newLeaf);
		}

		const branchHash = await this.saveNode(branch);

		// Wrap in extension if common prefix
		if (commonLen > 0) {
			const ext = createExtensionNode(leaf.path.slice(0, commonLen), branchHash);
			return await this.saveNode(ext);
		}

		return branchHash;
	}

	private async splitExtension(
		ext: ExtensionNode,
		newNibbles: Nibbles,
		newValue: Bytes,
		commonLen: number,
	): Promise<Bytes> {
		const branch = createBranchNode();

		// Old extension continues
		if (ext.path.length > commonLen + 1) {
			const remainingExt = createExtensionNode(ext.path.slice(commonLen + 1), ext.child);
			branch.children[ext.path[commonLen]!] = await this.saveNode(remainingExt);
		} else {
			branch.children[ext.path[commonLen]!] = ext.child;
		}

		// New value
		if (newNibbles.length === commonLen + 1) {
			branch.value = newValue;
		} else {
			const newLeaf = createLeafNode(newNibbles.slice(commonLen + 1), newValue);
			branch.children[newNibbles[commonLen]!] = await this.saveNode(newLeaf);
		}

		const branchHash = await this.saveNode(branch);

		// Wrap in extension if common prefix
		if (commonLen > 0) {
			const newExt = createExtensionNode(ext.path.slice(0, commonLen), branchHash);
			return await this.saveNode(newExt);
		}

		return branchHash;
	}

	private async buildProof(nodeRef: Bytes, nibbles: Nibbles, proof: Proof): Promise<void> {
		const node = await this.loadNode(nodeRef);
		if (node === null) return;

		const encoded = encodeNode(node);
		const hash = hashNode(node);
		proof.push({ hash, data: encoded });

		if (isLeafNode(node)) return;

		if (isExtensionNode(node)) {
			if (nibbles.length >= node.path.length && node.path.every((n, i) => n === nibbles[i])) {
				const remaining = nibbles.slice(node.path.length);
				await this.buildProof(node.child, remaining, proof);
			}
			return;
		}

		if (isBranchNode(node)) {
			if (nibbles.length === 0) return;
			const nibble = nibbles[0]!;
			const child = node.children[nibble];
			if (child) {
				const remaining = nibbles.slice(1);
				await this.buildProof(child, remaining, proof);
			}
		}
	}

	private async loadNode(nodeRef: Bytes): Promise<TrieNode> {
		if (isEmbeddedNode(nodeRef)) {
			return decodeNode(nodeRef);
		}

		const encoded = await this.db.get(nodeRef);
		if (!encoded) return null;

		return decodeNode(encoded);
	}

	private async saveNode(node: TrieNode): Promise<Bytes> {
		const hash = hashNode(node);

		// Don't store embedded nodes
		if (!isEmbeddedNode(hash)) {
			const encoded = encodeNode(node);
			await this.db.put(hash, encoded);
		}

		return hash;
	}
}
