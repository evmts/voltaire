import { Storage } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type StorageSlotType = Uint8Array & { readonly __tag: 'StorageSlot' }

/**
 * Error thrown when storage slot creation fails.
 *
 * @example
 * ```typescript
 * import { Storage } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(Storage.from('invalid')).catch(e => {
 *   if (e._tag === 'StorageError') {
 *     console.error('Storage error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class StorageError extends Error {
  readonly _tag = 'StorageError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * Creates a storage slot value from various input formats.
 * Storage slots are 32-byte values used to access contract storage.
 *
 * @param {bigint | number | string | Uint8Array} value - The slot value
 * @returns {Effect.Effect<StorageSlotType, StorageError>} Effect containing the StorageSlot or an error
 *
 * @example
 * ```typescript
 * import { Storage } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const slot = Storage.from(0n)
 * const slotFromHex = Storage.from('0x0')
 * Effect.runPromise(slot).then(console.log)
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: bigint | number | string | Uint8Array): Effect.Effect<StorageSlotType, StorageError> =>
  Effect.try({
    try: () => Storage.from(value) as unknown as StorageSlotType,
    catch: (e) => new StorageError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })
