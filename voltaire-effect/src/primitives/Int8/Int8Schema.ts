/**
 * @fileoverview Effect Schema definitions for Int8 (signed 8-bit integer) type.
 * Provides schema-based validation and parsing for values in the range -128 to 127.
 * @module Int8Schema
 * @since 0.0.1
 */

import { BrandedInt8 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a signed 8-bit integer.
 *
 * @description
 * A type-safe wrapper around JavaScript numbers that guarantees the value
 * is within the Int8 range: -128 to 127 (inclusive).
 *
 * @since 0.0.1
 * @see {@link Int16Type} for 16-bit signed integers
 * @see {@link Int32Type} for 32-bit signed integers
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
 *
 * @description
 * Accepts numbers, bigints, or numeric strings and validates they fall within
 * the Int8 range (-128 to 127). Values outside this range will cause a parse failure.
 *
 * Range: -128 (minimum) to 127 (maximum)
 *
 * @param input - A number, bigint, or string representing the integer
 * @returns The validated Int8Type
 * @throws {ParseError} When the value is outside the Int8 range or not a valid number
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
 *
 * // This will throw - out of range
 * // S.decodeSync(Schema)(200)
 * ```
 *
 * @since 0.0.1
 * @see {@link Int8Type} for the branded type definition
 * @see {@link from} for Effect-wrapped creation
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
