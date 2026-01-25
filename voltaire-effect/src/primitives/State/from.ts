import { State, Address } from '@tevm/voltaire'
import type { StorageKeyType, StorageKeyLike } from './StateSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when state/storage key operations fail.
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(State.from({})).catch(e => {
 *   if (e._tag === 'StateError') {
 *     console.error('State error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class StateError {
  readonly _tag = 'StateError'
  constructor(readonly message: string) {}
}

/**
 * Creates a StorageKey from a StorageKeyLike value.
 *
 * @param {StorageKeyLike} value - The value to convert
 * @returns {Effect.Effect<StorageKeyType, StateError>} Effect containing the StorageKey or an error
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const key = State.from({ address: new Uint8Array(20), slot: 0n })
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: StorageKeyLike): Effect.Effect<StorageKeyType, StateError> =>
  Effect.try({
    try: () => State.from(value),
    catch: (e) => new StateError((e as Error).message)
  })

/**
 * Creates a StorageKey from an address and slot number.
 *
 * @param {string | Uint8Array} address - The account address
 * @param {bigint} slot - The storage slot number
 * @returns {Effect.Effect<StorageKeyType, StateError>} Effect containing the StorageKey or an error
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* State.create('0x1234...', 0n)
 *   return key
 * })
 * ```
 *
 * @since 0.0.1
 */
export const create = (address: string | Uint8Array, slot: bigint): Effect.Effect<StorageKeyType, StateError> =>
  Effect.try({
    try: () => {
      const addr = typeof address === 'string' ? Address(address) : address
      return State.create(addr as Parameters<typeof State.create>[0], slot)
    },
    catch: (e) => new StateError((e as Error).message)
  })

/**
 * Converts a StorageKey to its string representation.
 *
 * @param {StorageKeyLike} key - The storage key to convert
 * @returns {string} String representation of the key
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * const str = State.toString(storageKey)
 * console.log(str) // "0x1234...:0"
 * ```
 *
 * @since 0.0.1
 */
export const toString = (key: StorageKeyLike): string => State.toString(key)

/**
 * Parses a StorageKey from its string representation.
 *
 * @param {string} str - The string to parse
 * @returns {StorageKeyType | undefined} The parsed StorageKey, or undefined if invalid
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * const key = State.fromString('0x1234...:0')
 * ```
 *
 * @since 0.0.1
 */
export const fromString = (str: string): StorageKeyType | undefined => State.fromString(str)

/**
 * Compares two StorageKeys for equality.
 *
 * @param {StorageKeyLike} a - First key
 * @param {StorageKeyLike} b - Second key
 * @returns {boolean} True if keys are equal
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * const areEqual = State.equals(key1, key2)
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: StorageKeyLike, b: StorageKeyLike): boolean => State.equals(a, b)

/**
 * Computes a hash code for a StorageKey.
 *
 * @param {StorageKeyLike} key - The key to hash
 * @returns {number} The hash code
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * const hash = State.hashCode(storageKey)
 * ```
 *
 * @since 0.0.1
 */
export const hashCode = (key: StorageKeyLike): number => State.hashCode(key)

/**
 * Type guard to check if a value is a StorageKeyType.
 *
 * @param {unknown} value - The value to check
 * @returns {boolean} True if value is a StorageKeyType
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * if (State.is(value)) {
 *   console.log('Is a valid StorageKey')
 * }
 * ```
 *
 * @since 0.0.1
 */
export const is = (value: unknown): value is StorageKeyType => State.is(value)
