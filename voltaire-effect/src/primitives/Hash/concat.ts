/**
 * @fileoverview Concatenate and hash multiple hashes.
 *
 * @module Hash/concat
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";

/**
 * Concatenate multiple hashes and hash the result.
 *
 * @description Concatenates all input hashes and computes the keccak256
 * hash of the combined bytes. This is a pure synchronous function that never fails.
 *
 * @param {...HashType[]} hashes - Hashes to concatenate and hash
 * @returns {Effect.Effect<HashType>} Effect containing the hash of concatenated hashes
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const combined = Effect.runSync(Hash.concat(hash1, hash2, hash3))
 * ```
 *
 * @since 0.0.1
 */
export const concat = (...hashes: HashType[]): Effect.Effect<HashType> =>
	Effect.sync(() => Hash.concat(...hashes));
