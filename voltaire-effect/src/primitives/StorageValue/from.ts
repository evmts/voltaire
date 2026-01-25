/**
 * @fileoverview Functions for creating EVM storage values.
 * Provides Effect-based constructors for StorageValue.
 * @module StorageValue/from
 * @since 0.0.1
 */

import { Bytes32 } from '@tevm/voltaire/Bytes'
import { InvalidLengthError } from '@tevm/voltaire/errors'
import type { StorageValueType } from './StorageValueSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Union type for values that can be converted to a StorageValue.
 *
 * @description
 * Accepts various input formats that can be normalized into a StorageValueType:
 * - Hex strings (with or without 0x prefix)
 * - Uint8Array (must be 32 bytes)
 * - bigint (will be padded to 32 bytes)
 * - number (will be padded to 32 bytes)
 * - Existing StorageValueType values
 *
 * @example
 * ```typescript
 * // All valid StorageValueLike values
 * const hex: StorageValueLike = '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'
 * const bytes: StorageValueLike = new Uint8Array(32)
 * const bigint: StorageValueLike = 1000000000000000000n
 * const num: StorageValueLike = 42
 * ```
 *
 * @since 0.0.1
 */
type StorageValueLike = StorageValueType | string | Uint8Array | bigint | number

/**
 * Creates a StorageValue from various input formats.
 *
 * @description
 * Converts hex strings, Uint8Arrays, bigints, or numbers into a normalized
 * 32-byte StorageValueType. This function wraps the creation in an Effect
 * for type-safe error handling.
 *
 * @param {StorageValueLike} value - The value to convert
 * @returns {Effect.Effect<StorageValueType, InvalidLengthError | Error>} Effect containing the StorageValue or an error
 *
 * @example
 * ```typescript
 * import { StorageValue } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // From bigint (e.g., uint256 balance)
 *   const balance = yield* StorageValue.from(1000000000000000000n) // 1 ETH
 *
 *   // From hex string
 *   const fromHex = yield* StorageValue.from('0x...32 bytes...')
 *
 *   // From number
 *   const fromNum = yield* StorageValue.from(42)
 *
 *   console.log('Value length:', balance.length) // 32
 *   return balance
 * })
 *
 * Effect.runPromise(program)
 * ```
 *
 * @throws {InvalidLengthError} When the input doesn't result in exactly 32 bytes
 * @throws {Error} When the input format is invalid
 *
 * @see {@link zero} for creating a zero value
 * @see {@link fromBigInt} for creating from bigint specifically
 * @see {@link StorageValueSchema} for schema-based validation
 *
 * @since 0.0.1
 */
export const from = (value: StorageValueLike): Effect.Effect<StorageValueType, InvalidLengthError | Error> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value) as StorageValueType,
    catch: (e) => e as InvalidLengthError | Error
  })

/**
 * Creates a zero StorageValue.
 *
 * @description
 * Returns a storage value of all zeros. This represents:
 * - The default value for uninitialized storage slots
 * - A deleted/cleared storage slot
 * - The value zero for numeric types
 * - False for booleans
 *
 * @returns {StorageValueType} A zero-filled storage value
 *
 * @example
 * ```typescript
 * import { StorageValue } from 'voltaire-effect/primitives'
 *
 * const zeroValue = StorageValue.zero()
 * console.log(zeroValue.length)  // 32
 * console.log(zeroValue[0])      // 0
 * console.log(zeroValue[31])     // 0
 * ```
 *
 * @see {@link from} for creating from other formats
 * @see {@link fromBigInt} for creating from bigint
 *
 * @since 0.0.1
 */
export const zero = (): StorageValueType => Bytes32.Bytes32(new Uint8Array(32)) as StorageValueType

/**
 * Creates a StorageValue from a bigint.
 *
 * @description
 * Convenience function for creating a storage value from a bigint.
 * This is the most common case as storage values often represent
 * uint256 or int256 values.
 *
 * @param {bigint} value - The bigint value to store
 * @returns {Effect.Effect<StorageValueType, Error>} Effect containing the StorageValue or an error
 *
 * @example
 * ```typescript
 * import { StorageValue } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Token balance (uint256)
 *   const balance = yield* StorageValue.fromBigInt(1000000000000000000n)
 *
 *   // Max uint256
 *   const maxUint = yield* StorageValue.fromBigInt(2n ** 256n - 1n)
 *
 *   return balance
 * })
 * ```
 *
 * @throws {Error} When the bigint is negative or exceeds 256 bits
 *
 * @see {@link from} for creating from other formats
 * @see {@link zero} for creating a zero value
 *
 * @since 0.0.1
 */
export const fromBigInt = (value: bigint): Effect.Effect<StorageValueType, Error> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value) as StorageValueType,
    catch: (e) => e as Error
  })
