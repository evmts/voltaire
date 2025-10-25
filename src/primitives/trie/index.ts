/**
 * Merkle Patricia Trie - Ethereum's state storage data structure
 *
 * This module implements the Modified Merkle Patricia Trie as specified
 * in the Ethereum Yellow Paper (Appendix D).
 *
 * ## Features
 *
 * - **CRUD Operations**: get, put, delete with efficient path compression
 * - **Merkle Proofs**: Generate and verify cryptographic proofs
 * - **Checkpoints**: Transaction-like commit/revert functionality
 * - **Deterministic**: Same operations produce same root hash
 * - **RLP Encoding**: Ethereum-compatible serialization
 *
 * ## Example
 *
 * ```typescript
 * import { create } from './trie';
 *
 * const trie = await create();
 *
 * // Insert key-value pairs
 * await trie.put(new Uint8Array([0x12, 0x34]), new Uint8Array([0xAB, 0xCD]));
 * await trie.put(new Uint8Array([0x56, 0x78]), new Uint8Array([0xEF, 0x01]));
 *
 * // Retrieve values
 * const value = await trie.get(new Uint8Array([0x12, 0x34]));
 *
 * // Get root hash for verification
 * const root = trie.root;
 *
 * // Generate Merkle proof
 * const proof = await trie.createProof(new Uint8Array([0x12, 0x34]));
 *
 * // Verify proof against root
 * const verified = await trie.verifyProof(root, new Uint8Array([0x12, 0x34]), proof);
 * ```
 *
 * ## Architecture
 *
 * The implementation uses pure TypeScript for:
 * - Maintainability and debugging
 * - Tree-shakability
 * - Cross-platform compatibility
 * - Direct integration with existing primitives (RLP, Keccak-256)
 *
 * ## Node Types
 *
 * - **Leaf**: Terminal node storing a value
 * - **Extension**: Path compression for shared prefixes
 * - **Branch**: Up to 16 children (one per nibble) plus optional value
 * - **Null**: Empty trie
 *
 * @module trie
 */

export { create } from "./trie.js";
export { MemoryDB } from "./db.js";
export {
	bytesToNibbles,
	nibblesToBytes,
	encodeNibbles,
	decodeNibbles,
	commonPrefixLength,
	nibblesToString,
} from "./nibbles.js";
export {
	createLeafNode,
	createExtensionNode,
	createBranchNode,
	encodeNode,
	decodeNode,
	hashNode,
	isEmbeddedNode,
	getNodeReference,
	isBranchNode,
	isExtensionNode,
	isLeafNode,
} from "./nodes.js";
export type {
	Bytes,
	Nibbles,
	TrieNode,
	BranchNode,
	ExtensionNode,
	LeafNode,
	ProofNode,
	Proof,
	TrieDB,
	Checkpoint,
	TrieOptions,
	Trie,
} from "./types.js";
