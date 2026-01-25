/**
 * @fileoverview Effect Schema definitions for Int16 (signed 16-bit integer) type.
 * Provides schema-based validation and parsing for values in the range -32768 to 32767.
 * @module Int16Schema
 * @since 0.0.1
 */

import { BrandedInt16 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a signed 16-bit integer.
 *
 * @description
 * A type-safe wrapper around JavaScript numbers that guarantees the value
 * is within the Int16 range: -32768 to 32767 (inclusive).
 *
 * @since 0.0.1
 * @see {@link Int8Type} for 8-bit signed integers
 * @see {@link Int32Type} for 32-bit signed integers
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
 *
 * @description
 * Accepts numbers, bigints, or numeric strings and validates they fall within
 * the Int16 range (-32768 to 32767). Values outside this range will cause a parse failure.
 *
 * Range: -32768 (minimum) to 32767 (maximum)
 *
 * @param input - A number, bigint, or string representing the integer
 * @returns The validated Int16Type
 * @throws {ParseError} When the value is outside the Int16 range or not a valid number
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
 *
 * // This will throw - out of range
 * // S.decodeSync(Schema)(50000)
 * ```
 *
 * @since 0.0.1
 * @see {@link Int16Type} for the branded type definition
 * @see {@link from} for Effect-wrapped creation
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
