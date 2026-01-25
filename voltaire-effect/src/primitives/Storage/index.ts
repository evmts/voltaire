/**
 * @module Storage
 *
 * Effect-based module for working with EVM storage slots.
 * Storage slots are 32-byte values used to access contract storage.
 *
 * @example
 * ```typescript
 * import { Storage } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const slot = yield* Storage.from(0n)
 *   return slot
 * })
 * ```
 *
 * @since 0.0.1
 */
export { StorageSlotSchema } from './StorageSchema.js'
export { from, StorageError } from './from.js'
