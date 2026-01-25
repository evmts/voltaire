/**
 * @fileoverview Effect Schema definitions for EVM storage slots.
 * Provides validation schemas for storage slot values.
 * @module Storage/StorageSchema
 * @since 0.0.1
 */

import { Storage } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Represents an EVM storage slot identifier.
 *
 * @description
 * A StorageSlot is a 32-byte value that identifies a location in contract storage.
 * The EVM uses a key-value storage model where each contract has 2^256 possible
 * storage slots, each holding a 32-byte value.
 *
 * Storage slots are used extensively in Solidity:
 * - Simple variables use slots 0, 1, 2, etc.
 * - Mappings use keccak256(key . slot)
 * - Dynamic arrays use keccak256(slot) + index
 *
 * @example
 * ```typescript
 * import { Storage } from 'voltaire-effect/primitives'
 *
 * // Slot 0 (first storage variable)
 * const slot0 = Storage.from(0n)
 *
 * // Slot from hex
 * const slotHex = Storage.from('0x0000...0005')
 * ```
 *
 * @since 0.0.1
 */
type StorageSlotType = Uint8Array & { readonly __tag: 'StorageSlot' }

const StorageSlotTypeSchema = S.declare<StorageSlotType>(
  (u): u is StorageSlotType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'StorageSlot' }
)

/**
 * Effect Schema for validating and parsing storage slot values.
 * Storage slots are 32-byte values that can be created from various inputs.
 *
 * @description
 * This schema transforms various input formats into a normalized 32-byte
 * storage slot. It accepts bigints, numbers, hex strings, and Uint8Arrays.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StorageSlotSchema } from 'voltaire-effect/primitives/Storage'
 *
 * const parse = S.decodeSync(StorageSlotSchema)
 *
 * // From bigint (most common)
 * const slot0 = parse(0n)
 * const slot5 = parse(5n)
 *
 * // From hex string
 * const slotHex = parse('0x0000000000000000000000000000000000000000000000000000000000000001')
 *
 * // From number
 * const slotNum = parse(42)
 * ```
 *
 * @throws {ParseError} When the input cannot be converted to a valid 32-byte value
 *
 * @see {@link from} for Effect-based creation
 *
 * @since 0.0.1
 */
export const StorageSlotSchema: S.Schema<StorageSlotType, bigint | number | string | Uint8Array> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String, S.Uint8ArrayFromSelf),
  StorageSlotTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Storage.from(value as bigint | number | string | Uint8Array) as unknown as StorageSlotType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (slot) => ParseResult.succeed(slot as Uint8Array)
  }
).annotations({ identifier: 'StorageSlotSchema' })
