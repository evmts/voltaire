/**
 * @fileoverview Effect Schema definition for Uint16 validation and transformation.
 * 
 * Provides type-safe schema for validating and transforming values into Uint16,
 * supporting number and string inputs with range validation (0-65535).
 * 
 * @module Uint16/Uint16Schema
 * @since 0.0.1
 */

import { BrandedUint16 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a 16-bit unsigned integer (0-65535).
 * 
 * @description
 * Branded type for Uint16 values, ensuring type safety at compile time.
 * Values are validated to be within the range 0 to 65535 inclusive.
 * 
 * Min value: 0
 * Max value: 65535 (2^16 - 1)
 * 
 * @example
 * ```typescript
 * import type { Uint16Type } from '@voltaire-effect/primitives/Uint16'
 * 
 * function processValue(value: Uint16Type): void {
 *   // Type-safe: only valid Uint16 values accepted
 * }
 * ```
 * 
 * @since 0.0.1
 */
export type Uint16Type = ReturnType<typeof BrandedUint16.from>

/**
 * Internal schema declaration for Uint16 type validation.
 * 
 * @description
 * Declares the Uint16 branded type for use in Effect Schema transformations.
 * Validates that values are numbers within the valid Uint16 range.
 * 
 * @internal
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
 * 
 * @description
 * Accepts number or string inputs and validates them as Uint16 values.
 * Valid range: 0 to 65535 (2^16 - 1).
 * 
 * Input types:
 * - `number`: Must be an integer in range 0-65535
 * - `string`: Must parse to an integer in range 0-65535
 * 
 * Encoding converts the Uint16 back to a number for serialization.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as Uint16Schema } from '@voltaire-effect/primitives/Uint16'
 * 
 * // Decode from number
 * const fromNumber = Schema.decodeSync(Uint16Schema)(65535)
 * 
 * // Decode from string
 * const fromString = Schema.decodeSync(Uint16Schema)('32768')
 * 
 * // Encode back to number
 * const encoded = Schema.encodeSync(Uint16Schema)(fromNumber)
 * console.log(typeof encoded) // 'number'
 * 
 * // Error cases
 * Schema.decodeSync(Uint16Schema)(65536)  // ParseError: out of range
 * Schema.decodeSync(Uint16Schema)(-1)     // ParseError: out of range
 * 
 * // Use in Effect pipelines
 * import * as Effect from 'effect/Effect'
 * const parsed = Effect.runSync(Schema.decode(Uint16Schema)(50000))
 * ```
 * 
 * @throws {ParseError} When value is negative
 * @throws {ParseError} When value exceeds 65535
 * @throws {ParseError} When string cannot be parsed as integer
 * 
 * @see {@link Uint16Type} for the resulting type
 * 
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
