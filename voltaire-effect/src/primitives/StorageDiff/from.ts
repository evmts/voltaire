import { StorageDiff } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type StorageDiffType = {
  readonly address: Uint8Array
  readonly changes: ReadonlyMap<any, any>
}

/**
 * Error thrown when storage diff operations fail.
 *
 * @example
 * ```typescript
 * import { StorageDiff } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(StorageDiff.from(new Uint8Array(20), [])).catch(e => {
 *   if (e._tag === 'StorageDiffError') {
 *     console.error('StorageDiff error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class StorageDiffError extends Error {
  readonly _tag = 'StorageDiffError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'StorageDiffError'
  }
}

/**
 * Creates a storage diff for a specific address with slot changes.
 *
 * @param {Uint8Array} address - The account address
 * @param {Map<any, any> | [any, any][]} changes - Map or array of slot changes
 * @returns {Effect.Effect<StorageDiffType, StorageDiffError>} Effect containing the StorageDiff or an error
 *
 * @example
 * ```typescript
 * import { StorageDiff } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const diff = yield* StorageDiff.from(
 *     addressBytes,
 *     new Map([[slot, { from: oldValue, to: newValue }]])
 *   )
 *   return diff
 * })
 * ```
 *
 * @since 0.0.1
 */
export const from = (
  address: Uint8Array,
  changes: Map<any, any> | [any, any][]
): Effect.Effect<StorageDiffType, StorageDiffError> =>
  Effect.try({
    try: () => StorageDiff.from(address as any, changes),
    catch: (e) => new StorageDiffError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })
