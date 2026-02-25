import { Trie } from "@tevm/voltaire";

type TrieType = Trie.TrieType;

/**
 * Compute the 32-byte root hash of the trie.
 * Pure function - never throws.
 *
 * @param trie - The trie to hash
 * @returns 32-byte root hash as Uint8Array
 * @since 0.0.1
 */
export const rootHash = (trie: TrieType): Uint8Array =>
	Trie.rootHash(trie);
