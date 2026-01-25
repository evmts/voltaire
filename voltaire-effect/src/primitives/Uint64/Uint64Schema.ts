import { Uint64 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a 64-bit unsigned integer (0 to 2^64-1).
 * @since 0.0.1
 */
export type Uint64Type = ReturnType<typeof Uint64.from>

/**
 * Internal schema declaration for Uint64 type validation.
 * @since 0.0.1
 */
const Uint64TypeSchema = S.declare<Uint64Type>(
  (u): u is Uint64Type => {
    if (typeof u !== 'bigint') return false
    return Uint64.isValid(u)
  },
  { identifier: 'Uint64' }
)

/**
 * Effect Schema for validating and transforming 64-bit unsigned integers.
 * @since 0.0.1
 */
export const Schema: S.Schema<Uint64Type, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  Uint64TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint64.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as bigint)
  }
).annotations({ identifier: 'Uint64Schema' })
