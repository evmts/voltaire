import { BrandedInt8 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a signed 8-bit integer (-128 to 127).
 * @since 0.0.1
 */
export type Int8Type = ReturnType<typeof BrandedInt8.from>

/**
 * Internal schema declaration for Int8 type validation.
 * @internal
 */
const Int8TypeSchema = S.declare<Int8Type>(
  (u): u is Int8Type => {
    if (typeof u !== 'number') return false
    return BrandedInt8.isValid(u)
  },
  { identifier: 'Int8' }
)

/**
 * Effect Schema for validating and parsing signed 8-bit integers.
 * Accepts numbers, bigints, or numeric strings and validates they fall within
 * the Int8 range (-128 to 127).
 *
 * @param input - A number, bigint, or string representing the integer
 * @returns The validated Int8Type
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/Int8'
 *
 * // Parse from number
 * const int8 = S.decodeSync(Schema)(42)
 *
 * // Parse from string
 * const fromString = S.decodeSync(Schema)('-100')
 *
 * // Parse from bigint
 * const fromBigInt = S.decodeSync(Schema)(127n)
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Int8Type, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  Int8TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedInt8.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as number)
  }
).annotations({ identifier: 'Int8Schema' })
