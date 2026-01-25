import { BrandedUint128 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a 128-bit unsigned integer (0 to 2^128-1).
 * @since 0.0.1
 */
export type Uint128Type = ReturnType<typeof BrandedUint128.from>

/**
 * Internal schema declaration for Uint128 type validation.
 * @since 0.0.1
 */
const Uint128TypeSchema = S.declare<Uint128Type>(
  (u): u is Uint128Type => {
    if (typeof u !== 'bigint') return false
    return BrandedUint128.isValid(u)
  },
  { identifier: 'Uint128' }
)

/**
 * Effect Schema for validating and transforming 128-bit unsigned integers.
 * @since 0.0.1
 */
export const Schema: S.Schema<Uint128Type, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  Uint128TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedUint128.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as bigint)
  }
).annotations({ identifier: 'Uint128Schema' })
