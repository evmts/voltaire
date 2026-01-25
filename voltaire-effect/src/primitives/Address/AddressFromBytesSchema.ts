/**
 * @fileoverview Effect Schema for creating Ethereum addresses from byte arrays.
 * Provides bidirectional transformation between Uint8Array and AddressType.
 * 
 * @module AddressFromBytesSchema
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Internal schema declaration for AddressType.
 * Validates that a value is a 20-byte Uint8Array with the Address brand.
 * 
 * @internal
 */
const AddressTypeSchema = Schema.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: 'AddressType' }
)

/**
 * Effect Schema for validating and parsing Ethereum addresses from bytes.
 * 
 * @description
 * Transforms Uint8Array (exactly 20 bytes) to AddressType branded Uint8Array
 * and vice versa. Uses Voltaire's Address.fromBytes for validation, ensuring
 * the byte array has the correct length.
 * 
 * The schema is bidirectional:
 * - **Decode**: Converts a 20-byte Uint8Array to AddressType
 * - **Encode**: Converts AddressType back to plain Uint8Array
 * 
 * @example Basic usage with decodeSync
 * ```typescript
 * import { AddressFromBytesSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * 
 * const bytes = new Uint8Array(20).fill(0xab)
 * const addr = Schema.decodeSync(AddressFromBytesSchema)(bytes)
 * // addr is AddressType (branded Uint8Array)
 * ```
 * 
 * @example Async decoding with Effect
 * ```typescript
 * import { AddressFromBytesSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Schema.decode(AddressFromBytesSchema)(bytes)
 * const addr = await Effect.runPromise(program)
 * ```
 * 
 * @example Encoding back to bytes
 * ```typescript
 * import { AddressFromBytesSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * 
 * const bytes = Schema.encodeSync(AddressFromBytesSchema)(addressType)
 * // bytes is Uint8Array(20)
 * ```
 * 
 * @example Error handling for wrong length
 * ```typescript
 * import { AddressFromBytesSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * 
 * try {
 *   Schema.decodeSync(AddressFromBytesSchema)(new Uint8Array(19))
 * } catch (e) {
 *   // ParseError: invalid address length (expected 20 bytes)
 * }
 * ```
 * 
 * @throws {ParseError} When the input byte array is not exactly 20 bytes.
 * 
 * @see {@link AddressSchema} for creating addresses from hex strings
 * @see {@link fromBytes} for Effect-based address creation from bytes
 * @see {@link toBytes} for converting addresses to bytes
 * 
 * @since 0.0.1
 */
export const AddressFromBytesSchema: Schema.Schema<AddressType, Uint8Array> = Schema.transformOrFail(
  Schema.Uint8ArrayFromSelf,
  AddressTypeSchema,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        return ParseResult.succeed(Address.fromBytes(bytes))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (addr, _options, ast) => {
      try {
        return ParseResult.succeed(Address.toBytes(addr))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, addr, (e as Error).message))
      }
    }
  }
)
