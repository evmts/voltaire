/**
 * @fileoverview Functions for creating EVM storage diffs.
 * Provides Effect-based constructors for StorageDiff.
 * @module StorageDiff/from
 * @since 0.0.1
 */

import { StorageDiff } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Represents storage slot changes for a specific account.
 * @see StorageDiffSchema for full documentation
 */
type StorageDiffType = {
  readonly address: Uint8Array
  readonly changes: ReadonlyMap<any, any>
}

/**
 * Error thrown when storage diff operations fail.
 *
 * @description
 * This error is thrown when storage diff creation or manipulation fails,
 * typically due to invalid address formats or malformed change data.
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

  /**
   * Creates a new StorageDiffError.
   *
   * @param {string} message - Error description
   * @param {unknown} [cause] - Original error that caused this failure
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'StorageDiffError'
  }
}

/**
 * Creates a storage diff for a specific address with slot changes.
 *
 * @description
 * Constructs a StorageDiff that tracks changes to storage slots for a single
 * account. Each change records the before (from) and after (to) values for
 * a storage slot.
 *
 * @param {Uint8Array} address - The account address (20 bytes)
 * @param {Map<any, any> | [any, any][]} changes - Map or array of slot changes
 * @returns {Effect.Effect<StorageDiffType, StorageDiffError>} Effect containing the StorageDiff or an error
 *
 * @example
 * ```typescript
 * import { StorageDiff, Storage, StorageValue } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const slot = yield* Storage.from(0n)
 *   const oldValue = yield* StorageValue.from(100n)
 *   const newValue = yield* StorageValue.from(200n)
 *
 *   const diff = yield* StorageDiff.from(
 *     addressBytes,
 *     new Map([
 *       [slot, { from: oldValue, to: newValue }]
 *     ])
 *   )
 *
 *   console.log('Changes:', diff.changes.size)
 *   return diff
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Create from array of tuples
 * const diff = yield* StorageDiff.from(addressBytes, [
 *   [slot0, { from: null, to: newValue }],  // Slot created
 *   [slot1, { from: oldValue, to: null }],  // Slot deleted
 *   [slot2, { from: val1, to: val2 }]       // Slot modified
 * ])
 * ```
 *
 * @throws {StorageDiffError} When the address or changes format is invalid
 *
 * @see {@link StorageDiffSchema} for schema-based validation
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
