import { ValidatorIndex } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a beacon chain validator index.
 * @since 0.0.1
 */
export type ValidatorIndexType = ReturnType<typeof ValidatorIndex.from>

/**
 * Internal schema declaration for ValidatorIndex type validation.
 * @since 0.0.1
 */
const ValidatorIndexTypeSchema = S.declare<ValidatorIndexType>(
  (u): u is ValidatorIndexType => {
    if (typeof u !== 'number') return false
    return Number.isInteger(u) && u >= 0
  },
  { identifier: 'ValidatorIndex' }
)

/**
 * Effect Schema for validating and transforming beacon chain validator indices.
 * @since 0.0.1
 */
export const Schema: S.Schema<ValidatorIndexType, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  ValidatorIndexTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(ValidatorIndex.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as number)
  }
).annotations({ identifier: 'ValidatorIndexSchema' })
