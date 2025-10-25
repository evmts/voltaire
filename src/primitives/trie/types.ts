/**
 * Merkle Patricia Trie Types
 *
 * Type definitions for Ethereum's Modified Merkle Patricia Trie
 * as specified in the Yellow Paper.
 */

/**
 * Raw byte data
 */
export type Bytes = Uint8Array;

/**
 * Nibbles (4-bit values) used for path traversal
 * Each byte is split into two nibbles (high and low)
 */
export type Nibbles = number[];

/**
 * Node types in the trie
 */
export type TrieNode = BranchNode | ExtensionNode | LeafNode | null;

/**
 * Branch node - has up to 16 children (one per nibble) and optional value
 */
export interface BranchNode {
	type: "branch";
	children: (Bytes | null)[];
	value: Bytes | null;
}

/**
 * Extension node - path compression for shared prefixes
 */
export interface ExtensionNode {
	type: "extension";
	path: Nibbles;
	child: Bytes;
}

/**
 * Leaf node - terminal node storing a value
 */
export interface LeafNode {
	type: "leaf";
	path: Nibbles;
	value: Bytes;
}

/**
 * Node in a Merkle proof
 */
export interface ProofNode {
	hash: Bytes;
	data: Bytes;
}

/**
 * Merkle proof - array of nodes proving existence/non-existence
 */
export type Proof = ProofNode[];

/**
 * Database interface for trie persistence
 */
export interface TrieDB {
	get(key: Bytes): Promise<Bytes | null>;
	put(key: Bytes, value: Bytes): Promise<void>;
	del(key: Bytes): Promise<void>;
	batch(ops: Array<{ type: "put" | "del"; key: Bytes; value?: Bytes }>): Promise<void>;
}

/**
 * Checkpoint for revert functionality
 */
export interface Checkpoint {
	root: Bytes | null;
	db: Map<string, Bytes | null>;
}

/**
 * Trie options
 */
export interface TrieOptions {
	root?: Bytes;
	db?: TrieDB;
	useCheckpoints?: boolean;
}

/**
 * Main Trie interface
 */
export interface Trie {
	root: Bytes | null;
	get(key: Bytes): Promise<Bytes | null>;
	put(key: Bytes, value: Bytes): Promise<void>;
	del(key: Bytes): Promise<void>;
	commit(): Promise<Bytes | null>;
	checkpoint(): void;
	revert(): void;
	createProof(key: Bytes): Promise<Proof>;
	verifyProof(root: Bytes, key: Bytes, proof: Proof): Promise<Bytes | null>;
	copy(): Trie;
}
