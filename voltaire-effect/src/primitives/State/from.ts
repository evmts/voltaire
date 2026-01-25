/**
 * @fileoverview Functions for creating and manipulating Ethereum storage keys.
 * Provides Effect-based constructors and utility functions for StorageKey.
 * @module State/from
 * @since 0.0.1
 */

import { State, Address } from '@tevm/voltaire'
import type { StorageKeyType, StorageKeyLike } from './StateSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when state/storage key operations fail.
 *
 * @description
 * This error is thrown when storage key creation or manipulation fails,
 * typically due to invalid address formats or slot values.
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
 * @description
 * Converts various input formats into a normalized StorageKeyType.
 * This function wraps the creation in an Effect for type-safe error handling.
 *
 * @param {StorageKeyLike} value - The value to convert
 * @returns {Effect.Effect<StorageKeyType, StateError>} Effect containing the StorageKey or an error
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* State.from({
 *     address: new Uint8Array(20),
 *     slot: 0n
 *   })
 *   console.log(key.slot) // 0n
 *   return key
 * })
 *
 * Effect.runPromise(program)
 * ```
 *
 * @throws {StateError} When the input cannot be converted to a valid storage key
 *
 * @see {@link create} for creating from separate address and slot arguments
 * @see {@link fromString} for parsing from string representation
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
 * @description
 * Convenience function for creating a storage key when you have
 * the address and slot as separate values. Accepts addresses as
 * hex strings or Uint8Arrays.
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
 *   const key = yield* State.create(
 *     '0x1234567890123456789012345678901234567890',
 *     5n
 *   )
 *   console.log(key.slot) // 5n
 *   return key
 * })
 * ```
 *
 * @throws {StateError} When the address is invalid or slot is negative
 *
 * @see {@link from} for creating from a StorageKeyLike object
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
 * @description
 * Creates a human-readable string representation of a storage key
 * in the format "0xaddress:slot". Useful for logging and debugging.
 *
 * @param {StorageKeyLike} key - The storage key to convert
 * @returns {string} String representation of the key (e.g., "0x1234...:0")
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* State.create('0x1234...', 5n)
 *   const str = State.toString(key)
 *   console.log(str) // "0x1234...:5"
 * })
 * ```
 *
 * @see {@link fromString} to parse back from string representation
 *
 * @since 0.0.1
 */
export const toString = (key: StorageKeyLike): string => State.toString(key)

/**
 * Parses a StorageKey from its string representation.
 *
 * @description
 * Converts a string in the format "0xaddress:slot" back into a StorageKeyType.
 * Returns undefined if the string format is invalid.
 *
 * @param {string} str - The string to parse
 * @returns {StorageKeyType | undefined} The parsed StorageKey, or undefined if invalid
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * const key = State.fromString('0x1234567890123456789012345678901234567890:5')
 * if (key) {
 *   console.log(key.slot) // 5n
 * }
 * ```
 *
 * @see {@link toString} to convert to string representation
 *
 * @since 0.0.1
 */
export const fromString = (str: string): StorageKeyType | undefined => State.fromString(str)

/**
 * Compares two StorageKeys for equality.
 *
 * @description
 * Performs a deep equality check comparing both the address
 * and slot values of two storage keys.
 *
 * @param {StorageKeyLike} a - First key
 * @param {StorageKeyLike} b - Second key
 * @returns {boolean} True if keys are equal
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const key1 = yield* State.create('0x1234...', 5n)
 *   const key2 = yield* State.create('0x1234...', 5n)
 *   console.log(State.equals(key1, key2)) // true
 * })
 * ```
 *
 * @since 0.0.1
 */
export const equals = (a: StorageKeyLike, b: StorageKeyLike): boolean => State.equals(a, b)

/**
 * Computes a hash code for a StorageKey.
 *
 * @description
 * Generates a numeric hash code suitable for use in hash-based
 * data structures. Two equal storage keys will have the same hash code.
 *
 * @param {StorageKeyLike} key - The key to hash
 * @returns {number} The hash code
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const key = yield* State.create('0x1234...', 5n)
 *   const hash = State.hashCode(key)
 *   console.log(hash) // numeric hash value
 * })
 * ```
 *
 * @since 0.0.1
 */
export const hashCode = (key: StorageKeyLike): number => State.hashCode(key)

/**
 * Type guard to check if a value is a StorageKeyType.
 *
 * @description
 * Runtime type check that determines if an unknown value
 * is a valid StorageKeyType. Useful for validation at runtime.
 *
 * @param {unknown} value - The value to check
 * @returns {boolean} True if value is a StorageKeyType
 *
 * @example
 * ```typescript
 * import { State } from 'voltaire-effect/primitives'
 *
 * const maybeKey = getFromSomewhere()
 * if (State.is(maybeKey)) {
 *   console.log('Valid StorageKey:', maybeKey.slot)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const is = (value: unknown): value is StorageKeyType => State.is(value)
