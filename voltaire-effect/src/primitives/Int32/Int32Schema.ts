/**
 * @fileoverview Effect Schema definitions for Int32 (signed 32-bit integer) type.
 * Provides schema-based validation and parsing for values in the range -2147483648 to 2147483647.
 * @module Int32Schema
 * @since 0.0.1
 */

import { BrandedInt32 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing a signed 32-bit integer.
 *
 * @description
 * A type-safe wrapper around JavaScript numbers that guarantees the value
 * is within the Int32 range: -2147483648 to 2147483647 (inclusive).
 *
 * @since 0.0.1
 * @see {@link Int16Type} for 16-bit signed integers
 * @see {@link Int64Type} for 64-bit signed integers
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
 *
 * @description
 * Accepts numbers, bigints, or numeric strings and validates they fall within
 * the Int32 range (-2147483648 to 2147483647). Values outside this range will cause a parse failure.
 *
 * Range: -2147483648 (minimum, −2^31) to 2147483647 (maximum, 2^31 - 1)
 *
 * @param input - A number, bigint, or string representing the integer
 * @returns The validated Int32Type
 * @throws {ParseError} When the value is outside the Int32 range or not a valid number
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
 *
 * // This will throw - out of range
 * // S.decodeSync(Schema)(9999999999)
 * ```
 *
 * @since 0.0.1
 * @see {@link Int32Type} for the branded type definition
 * @see {@link from} for Effect-wrapped creation
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
