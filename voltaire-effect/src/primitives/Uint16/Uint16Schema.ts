import { BrandedUint16 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a 16-bit unsigned integer (0-65535).
 * @since 0.0.1
 */
export type Uint16Type = ReturnType<typeof BrandedUint16.from>

/**
 * Internal schema declaration for Uint16 type validation.
 * @since 0.0.1
 */
const Uint16TypeSchema = S.declare<Uint16Type>(
  (u): u is Uint16Type => {
    if (typeof u !== 'number') return false
    return BrandedUint16.isValid(u)
  },
  { identifier: 'Uint16' }
)

/**
 * Effect Schema for validating and transforming 16-bit unsigned integers.
 * @since 0.0.1
 */
export const Schema: S.Schema<Uint16Type, number | string> = S.transformOrFail(
  S.Union(S.Number, S.String),
  Uint16TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedUint16.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as number)
  }
).annotations({ identifier: 'Uint16Schema' })
