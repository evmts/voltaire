import { Trie } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

type TrieType = Trie.TrieType;

/**
 * Look up a value in the trie by key. Returns null if not found.
 *
 * @param trie - The trie to search
 * @param key - Key to look up
 * @returns Effect yielding the value or null
 * @since 0.0.1
 */
export const get = (
	trie: TrieType,
	key: Uint8Array,
): Effect.Effect<Uint8Array | null, never> =>
	Effect.succeed(Trie.get(trie, key));
