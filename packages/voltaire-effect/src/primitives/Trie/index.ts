/**
 * Trie module for Merkle Patricia Trie operations.
 * Provides Effect-based functions for trie initialization, insertion, lookup,
 * deletion, and Merkle proof generation/verification.
 *
 * @example
 * ```typescript
 * import * as Trie from 'voltaire-effect/primitives/Trie'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const trie = yield* Trie.init()
 *   const updated = yield* Trie.put(trie, key, value)
 *   return Trie.rootHash(updated)
 * })
 * ```
 *
 * @since 0.0.1
 * @module
 */

export { TrieSchema, TrieSchema as Schema } from "./TrieSchema.js";
export { clear } from "./clear.js";
export { del } from "./del.js";
export { get } from "./get.js";
export { init } from "./init.js";
export { prove } from "./prove.js";
export { put } from "./put.js";
export { rootHash } from "./rootHash.js";
export { verify } from "./verify.js";
