/**
 * @fileoverview Compute Merkle root of hashes.
 *
 * @module Hash/merkleRoot
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Compute Merkle root of hash leaves.
 *
 * @description Computes the Merkle root of the given hash leaves.
 * This is a pure synchronous function that never fails.
 *
 * @param {HashType[]} leaves - Hash leaves
 * @returns {Effect.Effect<HashType>} Effect containing the Merkle root
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * const root = Effect.runSync(Hash.merkleRoot([leaf1, leaf2, leaf3, leaf4]))
 * ```
 *
 * @since 0.0.1
 */
export const merkleRoot = (leaves: HashType[]): Effect.Effect<HashType> =>
  Effect.sync(() => Hash.merkleRoot(leaves))
