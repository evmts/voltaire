import { Trie } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

type TrieType = Trie.TrieType;

/**
 * Initializes a new empty Merkle Patricia Trie.
 *
 * @returns Effect yielding an empty TrieType
 * @since 0.0.1
 */
export const init = (): Effect.Effect<TrieType, never> =>
	Effect.succeed(Trie.init());
