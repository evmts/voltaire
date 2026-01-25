import { FunctionSignature } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Represents a parsed Solidity function signature.
 * Contains the 4-byte selector, original signature string, and function name.
 * @since 0.0.1
 */
export type FunctionSignatureType = ReturnType<typeof FunctionSignature.from>

const FunctionSignatureTypeSchema = S.declare<FunctionSignatureType>(
  (u): u is FunctionSignatureType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as Record<string, unknown>
    // selector is Uint8Array (4 bytes), not string
    return obj.selector instanceof Uint8Array && typeof obj.signature === 'string' && typeof obj.name === 'string'
  },
  { identifier: 'FunctionSignature' }
)

/**
 * Effect Schema for validating and parsing function signatures.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/FunctionSignature'
 *
 * const sig = S.decodeSync(Schema)('transfer(address,uint256)')
 * // { selector: Uint8Array, signature: 'transfer(address,uint256)', name: 'transfer' }
 * ```
 * @since 0.0.1
 */
export const Schema: S.Schema<FunctionSignatureType, string> = S.transformOrFail(
  S.String,
  FunctionSignatureTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(FunctionSignature.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (f) => ParseResult.succeed(f.signature)
  }
).annotations({ identifier: 'FunctionSignatureSchema' })
