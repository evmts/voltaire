import { BrandedInt64 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a signed 64-bit integer.
 * Range: -9223372036854775808 to 9223372036854775807
 * @since 0.0.1
 */
export type Int64Type = ReturnType<typeof BrandedInt64.from>

/**
 * Internal schema declaration for Int64 type validation.
 * @internal
 */
const Int64TypeSchema = S.declare<Int64Type>(
  (u): u is Int64Type => {
    if (typeof u !== 'bigint') return false
    return BrandedInt64.isValid(u)
  },
  { identifier: 'Int64' }
)

/**
 * Effect Schema for validating and parsing signed 64-bit integers.
 * Accepts numbers, bigints, or numeric strings and validates they fall within
 * the Int64 range.
 *
 * @param input - A number, bigint, or string representing the integer
 * @returns The validated Int64Type
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/Int64'
 *
 * // Parse from bigint
 * const int64 = S.decodeSync(Schema)(9223372036854775807n)
 *
 * // Parse from string
 * const fromString = S.decodeSync(Schema)('-1000000000000')
 *
 * // Parse from number (within safe integer range)
 * const fromNumber = S.decodeSync(Schema)(1000000)
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Int64Type, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  Int64TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedInt64.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i)
  }
).annotations({ identifier: 'Int64Schema' })
