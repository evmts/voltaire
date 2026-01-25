/**
 * @fileoverview Effect Schema for Solidity error selectors.
 * @module ErrorSignature/ErrorSignatureSchema
 * @since 0.0.1
 *
 * @description
 * Error signatures are 4-byte selectors that identify Solidity custom errors.
 * They are computed the same way as function selectors: first 4 bytes of keccak256(signature).
 * When a transaction reverts, the error selector appears at the start of the revert data.
 */

import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { ErrorSignature } from '@tevm/voltaire'

/**
 * Type representing a 4-byte Solidity error selector.
 *
 * @description
 * An error signature is the first 4 bytes of keccak256(error definition).
 * For example, the standard Error(string) has selector 0x08c379a0.
 *
 * @example
 * ```typescript
 * import { ErrorSignature } from 'voltaire-effect/primitives'
 *
 * // Standard Solidity Error(string) selector
 * const sig: ErrorSignatureType = ErrorSignature.from('0x08c379a0')
 *
 * // Custom error
 * const custom: ErrorSignatureType = ErrorSignature.from('InsufficientBalance(uint256,uint256)')
 * ```
 *
 * @see {@link ErrorSignatureSchema} for validation
 * @see {@link from} for creating instances
 * @since 0.0.1
 */
export type ErrorSignatureType = ReturnType<typeof ErrorSignature.from>

/**
 * Input types accepted for creating an ErrorSignature.
 *
 * @description
 * Accepts:
 * - string: Error signature string like "InsufficientBalance(uint256,uint256)"
 * - string: Hex-encoded 4-byte selector
 * - Uint8Array: Raw 4-byte array
 *
 * @see {@link from} for usage
 * @since 0.0.1
 */
export type ErrorSignatureLike = Parameters<typeof ErrorSignature.from>[0]

/**
 * Internal schema for ErrorSignature validation.
 * @internal
 */
const ErrorSignatureTypeSchema = S.declare<ErrorSignatureType>(
  (u): u is ErrorSignatureType => u instanceof Uint8Array && u.length === 4,
  { identifier: 'ErrorSignature' }
)

/**
 * Effect Schema for validating Solidity error selectors.
 *
 * @description
 * Accepts hex strings or Uint8Array and returns branded ErrorSignatureType.
 * This schema validates that the input represents a valid 4-byte error selector.
 *
 * @example
 * ```typescript
 * import * as ErrorSignature from 'voltaire-effect/primitives/ErrorSignature'
 * import * as Schema from 'effect/Schema'
 *
 * const parse = Schema.decodeSync(ErrorSignature.ErrorSignatureSchema)
 *
 * // Parse from hex (standard Error(string) selector)
 * const sig = parse('0x08c379a0')
 *
 * // Parse from error definition
 * const custom = parse('InsufficientBalance(uint256,uint256)')
 *
 * // Parse Panic(uint256) error
 * const panic = parse('Panic(uint256)')  // 0x4e487b71
 * ```
 *
 * @throws {ParseError} When input is not a valid 4-byte selector
 * @see {@link from} for Effect-based creation
 * @since 0.0.1
 */
export const ErrorSignatureSchema: S.Schema<ErrorSignatureType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  ErrorSignatureTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(ErrorSignature.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (sig) => ParseResult.succeed(ErrorSignature.toHex(sig))
  }
).annotations({ identifier: 'ErrorSignatureSchema' })
