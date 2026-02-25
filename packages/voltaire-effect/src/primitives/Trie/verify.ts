import { Trie } from "@tevm/voltaire";
import * as Effect from "effect/Effect";

/**
 * Verify a Merkle proof against a root hash.
 *
 * @param root - Expected 32-byte root hash
 * @param key - Key to verify
 * @param proof - Array of RLP-encoded proof nodes
 * @returns Effect yielding { value, valid }
 * @since 0.0.1
 */
export const verify = (
	root: Uint8Array,
	key: Uint8Array,
	proof: ReadonlyArray<Uint8Array>,
): Effect.Effect<{ value: Uint8Array | null; valid: boolean }, never> =>
	Effect.succeed(Trie.verify(root, key, proof));
