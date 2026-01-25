/**
 * @module State
 *
 * Effect-based module for working with Ethereum state and storage keys.
 * Storage keys identify specific storage locations in Ethereum accounts.
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* State.create('0x1234...', 0n)
 *   const str = State.toString(key)
 *   return str
 * })
 * ```
 *
 * @since 0.0.1
 */
export { Schema, StorageKeySchema, type StorageKeyType, type StorageKeyLike } from './StateSchema.js'
export { from, create, toString, fromString, equals, hashCode, is, StateError } from './from.js'
