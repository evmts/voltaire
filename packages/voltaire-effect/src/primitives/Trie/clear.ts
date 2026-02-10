import { Trie } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

type TrieType = Trie.TrieType;

/**
 * Reset trie to empty state.
 *
 * @param trie - The trie to clear
 * @returns Effect yielding an empty trie
 * @since 0.0.1
 */
export const clear = (
	trie: TrieType,
): Effect.Effect<TrieType, never> =>
	Effect.succeed(Trie.clear(trie));
