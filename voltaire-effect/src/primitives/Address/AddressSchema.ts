/**
 * @fileoverview Effect Schema for Ethereum address validation and parsing.
 * Provides bidirectional transformation between hex strings and AddressType.
 * 
 * @module AddressSchema
 * @since 0.0.1
 */

import { Address, type AddressType } from '@tevm/voltaire/Address'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Internal schema declaration for AddressType.
 * Validates that a value is a 20-byte Uint8Array with the Address brand.
 * 
 * @internal
 */
const AddressTypeSchema = S.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: 'Address' }
)

/**
 * Effect Schema for validating and parsing Ethereum addresses.
 * 
 * @description
 * Transforms hex strings to AddressType branded Uint8Array and vice versa.
 * Uses Voltaire's Address constructor for validation, ensuring proper
 * format checking (0x prefix, 40 hex characters, valid hex digits).
 * 
 * The schema is bidirectional:
 * - **Decode**: Converts a hex string (e.g., "0x742d...") to AddressType
 * - **Encode**: Converts AddressType back to lowercase hex string
 * 
 * @example Basic usage with decodeSync
 * ```typescript
 * import { AddressSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * 
 * const addr = Schema.decodeSync(AddressSchema)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * // addr is AddressType (branded Uint8Array)
 * ```
 * 
 * @example Async decoding with Effect
 * ```typescript
 * import { AddressSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * import * as Effect from 'effect/Effect'
 * 
 * const program = Schema.decode(AddressSchema)('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * const addr = await Effect.runPromise(program)
 * ```
 * 
 * @example Encoding back to string
 * ```typescript
 * import { AddressSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * 
 * const hexString = Schema.encodeSync(AddressSchema)(addressBytes)
 * // hexString is "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
 * ```
 * 
 * @example Error handling
 * ```typescript
 * import { AddressSchema } from 'voltaire-effect/primitives/Address'
 * import * as Schema from 'effect/Schema'
 * 
 * try {
 *   Schema.decodeSync(AddressSchema)('invalid')
 * } catch (e) {
 *   // ParseError with message about invalid address format
 * }
 * ```
 * 
 * @throws {ParseError} When the input string is not a valid Ethereum address.
 *   Common reasons include:
 *   - Missing "0x" prefix
 *   - Wrong length (must be 42 characters including prefix)
 *   - Invalid hex characters
 * 
 * @see {@link AddressFromBytesSchema} for creating addresses from bytes
 * @see {@link ChecksummedAddressSchema} for checksummed output
 * @see {@link from} for Effect-based address creation
 * 
 * @since 0.0.1
 */
export const AddressSchema: S.Schema<AddressType, string> = S.transformOrFail(
  S.String,
  AddressTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Address(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (addr, _options, ast) => {
      try {
        return ParseResult.succeed(Address.toHex(addr))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, addr, (e as Error).message))
      }
    }
  }
).annotations({ identifier: 'AddressSchema' })
