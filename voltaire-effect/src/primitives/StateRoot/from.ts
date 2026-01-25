/**
 * @fileoverview Functions for creating Ethereum state roots.
 * Provides Effect-based constructors for StateRoot.
 * @module StateRoot/from
 * @since 0.0.1
 */

import { Bytes32 } from '@tevm/voltaire/Bytes'
import { InvalidLengthError } from '@tevm/voltaire/errors'
import type { StateRootType } from './StateRootSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Union type for values that can be converted to a StateRoot.
 *
 * @description
 * Accepts various input formats that can be normalized into a StateRootType:
 * - Hex strings (with or without 0x prefix)
 * - Uint8Array (must be 32 bytes)
 * - bigint (will be padded to 32 bytes)
 * - number (will be padded to 32 bytes)
 * - Existing StateRootType values
 *
 * @example
 * ```typescript
 * // All valid StateRootLike values
 * const hex: StateRootLike = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
 * const bytes: StateRootLike = new Uint8Array(32)
 * const bigint: StateRootLike = 0n
 * ```
 *
 * @since 0.0.1
 */
type StateRootLike = StateRootType | string | Uint8Array | bigint | number

/**
 * Creates a StateRoot from various input formats.
 *
 * @description
 * Converts hex strings, Uint8Arrays, bigints, or numbers into a normalized
 * 32-byte StateRootType. This function wraps the creation in an Effect for
 * type-safe error handling.
 *
 * @param {StateRootLike} value - The value to convert
 * @returns {Effect.Effect<StateRootType, InvalidLengthError | Error>} Effect containing the StateRoot or an error
 *
 * @example
 * ```typescript
 * import { StateRoot } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // From hex string
 *   const root = yield* StateRoot.from(
 *     '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
 *   )
 *
 *   console.log('State root:', root)
 *   return root
 * })
 *
 * Effect.runPromise(program)
 * ```
 *
 * @example
 * ```typescript
 * // From Uint8Array
 * const root = yield* StateRoot.from(new Uint8Array(32))
 *
 * // From bigint (zero state root)
 * const zeroRoot = yield* StateRoot.from(0n)
 * ```
 *
 * @throws {InvalidLengthError} When the input doesn't result in exactly 32 bytes
 * @throws {Error} When the input format is invalid
 *
 * @see {@link empty} for creating an empty state root
 * @see {@link StateRootSchema} for schema-based validation
 *
 * @since 0.0.1
 */
export const from = (value: StateRootLike): Effect.Effect<StateRootType, InvalidLengthError | Error> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value) as StateRootType,
    catch: (e) => e as InvalidLengthError | Error
  })

/**
 * Creates an empty StateRoot (all zeros).
 *
 * @description
 * Returns a state root representing an empty or uninitialized state trie.
 * This is a 32-byte array filled with zeros. Note that this is different
 * from the "empty trie root" which is the hash of an empty trie.
 *
 * @returns {StateRootType} A zero-filled state root
 *
 * @example
 * ```typescript
 * import { StateRoot } from 'voltaire-effect/primitives'
 *
 * const emptyRoot = StateRoot.empty()
 * console.log(emptyRoot.length) // 32
 * console.log(emptyRoot[0])     // 0
 * ```
 *
 * @see {@link from} for creating from other formats
 *
 * @since 0.0.1
 */
export const empty = (): StateRootType => Bytes32.Bytes32(new Uint8Array(32)) as StateRootType
