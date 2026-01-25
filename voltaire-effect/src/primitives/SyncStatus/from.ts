import { SyncStatus } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type SyncProgress = {
  readonly startingBlock: bigint
  readonly currentBlock: bigint
  readonly highestBlock: bigint
  readonly pulledStates?: bigint
  readonly knownStates?: bigint
}

type SyncStatusType = false | SyncProgress

/**
 * Error thrown when sync status creation fails.
 *
 * @example
 * ```typescript
 * import { SyncStatus } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(SyncStatus.from(invalidData)).catch(e => {
 *   if (e._tag === 'SyncStatusError') {
 *     console.error('SyncStatus error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class SyncStatusError extends Error {
  readonly _tag = 'SyncStatusError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'SyncStatusError'
  }
}

/**
 * Input type for creating a SyncStatus.
 *
 * @since 0.0.1
 */
export type SyncStatusInput = boolean | {
  startingBlock: bigint | number | string
  currentBlock: bigint | number | string
  highestBlock: bigint | number | string
  pulledStates?: bigint | number | string
  knownStates?: bigint | number | string
}

/**
 * Creates a SyncStatus from various input formats.
 * Returns `false` if the node is synced, or sync progress details if syncing.
 *
 * @param {SyncStatusInput} value - Boolean or sync progress object
 * @returns {Effect.Effect<SyncStatusType, SyncStatusError>} Effect containing the SyncStatus or an error
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
 *   if (status === false) {
 *     console.log('Node is synced')
 *   } else {
 *     console.log(`Syncing: ${status.currentBlock}/${status.highestBlock}`)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: SyncStatusInput): Effect.Effect<SyncStatusType, SyncStatusError> =>
  Effect.try({
    try: () => SyncStatus.from(value as any) as SyncStatusType,
    catch: (e) => new SyncStatusError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })
