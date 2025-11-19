import type { brand } from "../../brand.js";
import type { HashType } from "../Hash/HashType.js";

/**
 * Branded StateRoot type - represents a 32-byte Merkle Patricia Trie root hash
 * of the global Ethereum state.
 *
 * The state root is the root hash of the state trie, which contains mappings
 * from addresses to account states. It uniquely identifies the entire global
 * state at a given block.
 *
 * Per the Yellow Paper, the state trie encodes mappings between addresses
 * (160-bit identifiers) and account states. The state root is included in
 * every block header.
 */
export type StateRootType = HashType & {
	readonly [brand]: "StateRoot";
	readonly length: 32;
};

/**
 * Inputs that can be converted to StateRoot
 */
export type StateRootLike = StateRootType | string | Uint8Array;

export const SIZE = 32;
