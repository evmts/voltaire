import { Trie } from "@tevm/voltaire";
import type { TrieProof } from "@tevm/voltaire/Trie";
import * as Effect from "effect/Effect";

type TrieType = Trie.TrieType;

/**
 * Generate a Merkle proof for a key.
 *
 * @param trie - The trie to generate proof from
 * @param key - Key to prove
 * @returns Effect yielding the proof
 * @since 0.0.1
 */
export const prove = (
	trie: TrieType,
	key: Uint8Array,
): Effect.Effect<TrieProof, never> =>
	Effect.succeed(Trie.prove(trie, key));
