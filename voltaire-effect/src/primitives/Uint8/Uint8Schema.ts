import { BrandedUint8 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing an 8-bit unsigned integer (0-255).
 * @since 0.0.1
 */
export type Uint8Type = ReturnType<typeof BrandedUint8.from>

/**
 * Internal schema declaration for Uint8 type validation.
 * @since 0.0.1
 */
const Uint8TypeSchema = S.declare<Uint8Type>(
  (u): u is Uint8Type => {
    if (typeof u !== 'number') return false
    return BrandedUint8.isValid(u)
  },
  { identifier: 'Uint8' }
)

/**
 * Effect Schema for validating and transforming 8-bit unsigned integers.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as Uint8Schema } from './Uint8Schema.js'
 * 
 * const value = Schema.decodeSync(Uint8Schema)(255)
 * ```
 * 
 * @since 0.0.1
 */
export const Schema: S.Schema<Uint8Type, number | string> = S.transformOrFail(
  S.Union(S.Number, S.String),
  Uint8TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedUint8.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (i) => ParseResult.succeed(i as number)
  }
).annotations({ identifier: 'Uint8Schema' })
