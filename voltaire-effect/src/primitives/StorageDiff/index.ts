/**
 * @module StorageDiff
 *
 * Effect-based module for working with storage diffs.
 * Storage diffs track changes to contract storage slots.
 *
 * @example
 * ```typescript
 * import { StorageDiff } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const diff = yield* StorageDiff.from(address, changes)
 *   return diff
 * })
 * ```
 *
 * @since 0.0.1
 */
export { StorageDiffSchema } from './StorageDiffSchema.js'
export { from, StorageDiffError } from './from.js'
