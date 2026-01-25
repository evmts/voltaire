/**
 * @module SyncStatus
 *
 * Effect-based module for working with Ethereum node sync status.
 * Tracks whether a node is synced or actively syncing.
 *
 * @example
 * ```typescript
 * import { SyncStatus } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const status = yield* SyncStatus.from({
 *     startingBlock: 0n,
 *     currentBlock: 1000n,
 *     highestBlock: 2000n
 *   })
 *   return status
 * })
 * ```
 *
 * @since 0.0.1
 */

export { SyncStatusSchema } from "./SyncStatusSchema.js";
