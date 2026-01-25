import { BrandedUint32 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a 32-bit unsigned integer (0-4294967295).
 * @since 0.0.1
 */
export type Uint32Type = ReturnType<typeof BrandedUint32.from>

/**
 * Internal schema declaration for Uint32 type validation.
 * @since 0.0.1
 */
const Uint32TypeSchema = S.declare<Uint32Type>(
  (u): u is Uint32Type => {
    if (typeof u !== 'number') return false
    return BrandedUint32.isValid(u)
  },
  { identifier: 'Uint32' }
)

/**
 * Effect Schema for validating and transforming 32-bit unsigned integers.
 * @since 0.0.1
 */
export const Schema: S.Schema<Uint32Type, number | bigint | string> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf, S.String),
  Uint32TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedUint32.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as number)
  }
).annotations({ identifier: 'Uint32Schema' })
