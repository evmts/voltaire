import { BrandedInt32 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a signed 32-bit integer (-2147483648 to 2147483647).
 * @since 0.0.1
 */
export type Int32Type = ReturnType<typeof BrandedInt32.from>

/**
 * Internal schema declaration for Int32 type validation.
 * @internal
 */
const Int32TypeSchema = S.declare<Int32Type>(
  (u): u is Int32Type => {
    if (typeof u !== 'number') return false
    return BrandedInt32.isValid(u)
  },
  { identifier: 'Int32' }
)

/**
 * Effect Schema for validating and parsing signed 32-bit integers.
 * Accepts numbers, bigints, or numeric strings and validates they fall within
 * the Int32 range (-2147483648 to 2147483647).
 *
 * @param input - A number, bigint, or string representing the integer
 * @returns The validated Int32Type
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/Int32'
 *
 * // Parse from number
 * const int32 = S.decodeSync(Schema)(1000000)
 *
 * // Parse from string
 * const fromString = S.decodeSync(Schema)('-500000')
 *
 * // Parse from bigint
 * const fromBigInt = S.decodeSync(Schema)(2147483647n)
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Int32Type, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  Int32TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedInt32.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as number)
  }
).annotations({ identifier: 'Int32Schema' })
