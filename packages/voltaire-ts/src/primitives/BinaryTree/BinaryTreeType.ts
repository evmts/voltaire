/**
 * Binary State Tree (EIP-7864) - Unified tree structure for Ethereum state
 *
 * @see https://eips.ethereum.org/EIPS/eip-7864
 */

export interface BinaryTree {
	readonly root: Node;
}

export type Node =
	| { readonly type: "empty" }
	| {
			readonly type: "internal";
			/** Hash of the left subtree (zero hash when empty) */
			readonly left: Uint8Array;
			/** Hash of the right subtree (zero hash when empty) */
			readonly right: Uint8Array;
			/**
			 * Left subtree. Absent for hash-only (pruned) nodes; `get`/`insert`
			 * treat an absent child with a zero hash as empty and throw
			 * `InvalidTreeStateError` when the hash is non-zero.
			 */
			readonly leftChild?: Node;
			/** Right subtree. Same semantics as `leftChild`. */
			readonly rightChild?: Node;
	  }
	| {
			readonly type: "stem";
			readonly stem: Uint8Array;
			readonly values: (Uint8Array | null)[];
	  }
	| { readonly type: "leaf"; readonly value: Uint8Array };

export type InternalNode = Extract<Node, { type: "internal" }>;
export type StemNode = Extract<Node, { type: "stem" }>;
export type LeafNode = Extract<Node, { type: "leaf" }>;
export type EmptyNode = Extract<Node, { type: "empty" }>;

/**
 * Account basic data layout at index 0
 * - Version (1 byte)
 * - Code size (3 bytes)
 * - Nonce (8 bytes)
 * - Balance (16 bytes)
 */
export interface AccountData {
	readonly version: number;
	readonly codeSize: number;
	readonly nonce: bigint;
	readonly balance: bigint;
}
