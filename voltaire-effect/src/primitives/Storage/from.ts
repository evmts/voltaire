/**
 * @fileoverview Functions for creating EVM storage slot identifiers.
 * Provides Effect-based constructors for Storage slots.
 * @module Storage/from
 * @since 0.0.1
 */

import { Storage } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Represents an EVM storage slot identifier.
 * @see StorageSchema for full documentation
 */
type StorageSlotType = Uint8Array & { readonly __tag: 'StorageSlot' }

/**
 * Error thrown when storage slot creation fails.
 *
 * @description
 * This error is thrown when a storage slot cannot be created from the
 * provided input, typically due to invalid format or value overflow.
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

  /**
   * Creates a new StorageError.
   *
   * @param {string} message - Error description
   * @param {unknown} [cause] - Original error that caused this failure
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * Creates a storage slot value from various input formats.
 * Storage slots are 32-byte values used to access contract storage.
 *
 * @description
 * Converts bigints, numbers, hex strings, or Uint8Arrays into a normalized
 * 32-byte storage slot identifier. This function wraps the creation in an
 * Effect for type-safe error handling.
 *
 * Storage slots in the EVM:
 * - Are 256-bit (32 byte) values
 * - Index into contract storage (2^256 possible slots)
 * - Are typically sequential for simple variables (0, 1, 2, ...)
 * - Use hashing for mappings and dynamic arrays
 *
 * @param {bigint | number | string | Uint8Array} value - The slot value
 * @returns {Effect.Effect<StorageSlotType, StorageError>} Effect containing the StorageSlot or an error
 *
 * @example
 * ```typescript
 * import { Storage } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Storage slot 0 (first state variable)
 *   const slot0 = yield* Storage.from(0n)
 *
 *   // Storage slot 5
 *   const slot5 = yield* Storage.from(5n)
 *
 *   // From hex string
 *   const slotHex = yield* Storage.from('0x0')
 *
 *   console.log('Slot length:', slot0.length) // 32
 *   return slot0
 * })
 *
 * Effect.runPromise(program)
 * ```
 *
 * @example
 * ```typescript
 * // Computing mapping slot for Solidity: mapping(address => uint256)
 * import { keccak256, concat, padLeft } from '@tevm/voltaire'
 *
 * const mappingSlot = 0n  // Base slot of the mapping
 * const key = address     // The mapping key
 *
 * // slot = keccak256(key . mappingSlot)
 * const computedSlot = keccak256(concat(padLeft(key, 32), padLeft(mappingSlot, 32)))
 * const slot = yield* Storage.from(computedSlot)
 * ```
 *
 * @throws {StorageError} When the input cannot be converted to a valid storage slot
 *
 * @see {@link StorageSlotSchema} for schema-based validation
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
