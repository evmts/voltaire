import { BrandedInt16 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a signed 16-bit integer (-32768 to 32767).
 * @since 0.0.1
 */
export type Int16Type = ReturnType<typeof BrandedInt16.from>

/**
 * Internal schema declaration for Int16 type validation.
 * @internal
 */
const Int16TypeSchema = S.declare<Int16Type>(
  (u): u is Int16Type => {
    if (typeof u !== 'number') return false
    return BrandedInt16.isValid(u)
  },
  { identifier: 'Int16' }
)

/**
 * Effect Schema for validating and parsing signed 16-bit integers.
 * Accepts numbers, bigints, or numeric strings and validates they fall within
 * the Int16 range (-32768 to 32767).
 *
 * @param input - A number, bigint, or string representing the integer
 * @returns The validated Int16Type
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/Int16'
 *
 * // Parse from number
 * const int16 = S.decodeSync(Schema)(1000)
 *
 * // Parse from string
 * const fromString = S.decodeSync(Schema)('-5000')
 *
 * // Parse from bigint
 * const fromBigInt = S.decodeSync(Schema)(32767n)
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Int16Type, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  Int16TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedInt16.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as number)
  }
).annotations({ identifier: 'Int16Schema' })
