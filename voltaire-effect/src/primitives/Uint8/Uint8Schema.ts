/**
 * @fileoverview Effect Schema definition for Uint8 validation and transformation.
 * 
 * Provides type-safe schema for validating and transforming values into Uint8,
 * supporting number and string inputs with range validation (0-255).
 * 
 * @module Uint8/Uint8Schema
 * @since 0.0.1
 */

import { BrandedUint8 } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing an 8-bit unsigned integer (0-255).
 * 
 * @description
 * Branded type for Uint8 values, ensuring type safety at compile time.
 * Values are validated to be within the range 0 to 255 inclusive.
 * 
 * Min value: 0
 * Max value: 255 (2^8 - 1)
 * 
 * @example
 * ```typescript
 * import type { Uint8Type } from '@voltaire-effect/primitives/Uint8'
 * 
 * function processValue(value: Uint8Type): void {
 *   // Type-safe: only valid Uint8 values accepted
 * }
 * ```
 * 
 * @since 0.0.1
 */
export type Uint8Type = ReturnType<typeof BrandedUint8.from>

/**
 * Internal schema declaration for Uint8 type validation.
 * 
 * @description
 * Declares the Uint8 branded type for use in Effect Schema transformations.
 * Validates that values are numbers within the valid Uint8 range.
 * 
 * @internal
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
 * @description
 * Accepts number or string inputs and validates them as Uint8 values.
 * Valid range: 0 to 255 (2^8 - 1).
 * 
 * Input types:
 * - `number`: Must be an integer in range 0-255
 * - `string`: Must parse to an integer in range 0-255
 * 
 * Encoding converts the Uint8 back to a number for serialization.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as Uint8Schema } from '@voltaire-effect/primitives/Uint8'
 * 
 * // Decode from number
 * const fromNumber = Schema.decodeSync(Uint8Schema)(255)
 * 
 * // Decode from string
 * const fromString = Schema.decodeSync(Uint8Schema)('128')
 * 
 * // Encode back to number
 * const encoded = Schema.encodeSync(Uint8Schema)(fromNumber)
 * console.log(typeof encoded) // 'number'
 * 
 * // Error cases
 * Schema.decodeSync(Uint8Schema)(256)  // ParseError: out of range
 * Schema.decodeSync(Uint8Schema)(-1)   // ParseError: out of range
 * 
 * // Use in Effect pipelines
 * import * as Effect from 'effect/Effect'
 * const parsed = Effect.runSync(Schema.decode(Uint8Schema)(200))
 * ```
 * 
 * @throws {ParseError} When value is negative
 * @throws {ParseError} When value exceeds 255
 * @throws {ParseError} When string cannot be parsed as integer
 * 
 * @see {@link Uint8Type} for the resulting type
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
