/**
 * @fileoverview Effect Schema definitions for 32-byte Ethereum hash values.
 *
 * Provides type-safe validation and transformation between hex string representations
 * and the internal HashType (branded Uint8Array). Used for validating transaction hashes,
 * block hashes, storage keys, and other 32-byte cryptographic values.
 *
 * @module HashSchema
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { HashSchema } from 'voltaire-effect/primitives/Hash'
 *
 * // Decode from hex string
 * const hash = S.decodeSync(HashSchema)('0x' + 'ab'.repeat(32))
 *
 * // Encode back to hex
 * const hex = S.encodeSync(HashSchema)(hash)
 * ```
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Internal schema for validating 32-byte hash values.
 *
 * @description Declares a schema that validates whether a value is a Uint8Array
 * with exactly 32 bytes, which is the standard size for Ethereum hashes.
 *
 * @internal
 * @since 0.0.1
 */
const HashTypeSchema = S.declare<HashType>(
  (u): u is HashType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'Hash' }
)

/**
 * Effect Schema for validating and transforming 32-byte hash values.
 *
 * @description Transforms hex string input into HashType (branded Uint8Array).
 * Validates that the input is a properly formatted 66-character hex string
 * (0x prefix + 64 hex characters) representing 32 bytes.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { HashSchema } from 'voltaire-effect/primitives/Hash'
 *
 * // Decode a transaction hash
 * const txHash = S.decodeSync(HashSchema)(
 *   '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'
 * )
 *
 * // Validate and decode in a pipeline
 * import * as Effect from 'effect/Effect'
 * const validated = yield* S.decode(HashSchema)(userInput)
 * ```
 *
 * @throws {ParseResult.Type} When the input string is not a valid 32-byte hex value
 *
 * @see {@link fromHex} - Effect-based alternative for hash creation
 * @see {@link toHex} - Convert HashType back to hex string
 *
 * @since 0.0.1
 */
export const HashSchema: S.Schema<HashType, string> = S.transformOrFail(
  S.String,
  HashTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Hash.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (h) => ParseResult.succeed(Hash.toHex(h))
  }
).annotations({ identifier: 'HashSchema' })
