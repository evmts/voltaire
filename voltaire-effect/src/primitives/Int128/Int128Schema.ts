import { BrandedInt128 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a signed 128-bit integer.
 * Range: -2^127 to 2^127-1
 * @since 0.0.1
 */
export type Int128Type = ReturnType<typeof BrandedInt128.from>

/**
 * Internal schema declaration for Int128 type validation.
 * @internal
 */
const Int128TypeSchema = S.declare<Int128Type>(
  (u): u is Int128Type => {
    if (typeof u !== 'bigint') return false
    return BrandedInt128.isValid(u)
  },
  { identifier: 'Int128' }
)

/**
 * Effect Schema for validating and parsing signed 128-bit integers.
 * Accepts numbers, bigints, or numeric strings and validates they fall within
 * the Int128 range.
 *
 * @param input - A number, bigint, or string representing the integer
 * @returns The validated Int128Type
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/Int128'
 *
 * // Parse from bigint
 * const int128 = S.decodeSync(Schema)(170141183460469231731687303715884105727n)
 *
 * // Parse from string
 * const fromString = S.decodeSync(Schema)('-1000000000000000000000')
 *
 * // Parse from number
 * const fromNumber = S.decodeSync(Schema)(1000000)
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Int128Type, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  Int128TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedInt128.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i)
  }
).annotations({ identifier: 'Int128Schema' })
