import { Trie } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

type TrieType = Trie.TrieType;

/**
 * Delete a key from the trie. Returns new trie (immutable).
 *
 * @param trie - The trie to delete from
 * @param key - Key to delete
 * @returns Effect yielding the updated trie
 * @since 0.0.1
 */
export const del = (
	trie: TrieType,
	key: Uint8Array,
): Effect.Effect<TrieType, never> =>
	Effect.succeed(Trie.del(trie, key));
