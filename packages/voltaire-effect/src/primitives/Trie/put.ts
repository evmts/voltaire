import { Trie } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

type TrieType = Trie.TrieType;

/**
 * Insert a key-value pair into the trie. Returns new trie (immutable).
 *
 * @param trie - The trie to insert into
 * @param key - Key bytes
 * @param value - Value bytes
 * @returns Effect yielding the updated trie
 * @since 0.0.1
 */
export const put = (
	trie: TrieType,
	key: Uint8Array,
	value: Uint8Array,
): Effect.Effect<TrieType, never> =>
	Effect.succeed(Trie.put(trie, key, value));
