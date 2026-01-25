/**
 * @fileoverview Effect Schema definitions for Int256 (signed 256-bit integer) type.
 * Provides schema-based validation and parsing for Solidity's int256 type.
 * @module Int256Schema
 * @since 0.0.1
 */

import { BrandedInt256 } from '@tevm/voltaire'
const Int256 = BrandedInt256.from
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * The branded Int256 type representing a signed 256-bit integer.
 *
 * @description
 * A type-safe wrapper around JavaScript BigInt that guarantees the value
 * is within Solidity's int256 range.
 *
 * Range: -2^255 to 2^255-1 (the range used by Solidity's int256)
 *
 * This is the native signed integer type used in Solidity smart contracts.
 *
 * @since 0.0.1
 * @see {@link Int128Type} for 128-bit signed integers
 * @see {@link Uint256} for unsigned 256-bit integers
 */
export type Int256Type = BrandedInt256.BrandedInt256

/**
 * Internal schema declaration for Int256 type validation.
 * @internal
 */
const Int256TypeSchema = S.declare<Int256Type>(
  (u): u is Int256Type => typeof u === 'bigint',
  { identifier: 'Int256' }
)

/**
 * Effect Schema for validating and parsing signed 256-bit integers.
 *
 * @description
 * Accepts bigints, numbers, or numeric strings and validates they fall within
 * the Int256 range (Solidity's int256). Values outside this range will cause a parse failure.
 *
 * Range: -2^255 (minimum) to 2^255-1 (maximum)
 *
 * @param input - A bigint, number, or string representing the integer
 * @returns The validated Int256Type
 * @throws {ParseError} When the value is outside the Int256 range or not a valid number
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Int256Schema } from 'voltaire-effect/Int256'
 *
 * // Parse from bigint
 * const int256 = S.decodeSync(Int256Schema)(12345678901234567890123456789n)
 *
 * // Parse from string
 * const fromString = S.decodeSync(Int256Schema)('-999999999999999999999999999')
 *
 * // Parse from number
 * const fromNumber = S.decodeSync(Int256Schema)(1000000)
 * ```
 *
 * @since 0.0.1
 * @see {@link Int256FromHexSchema} for parsing from hex strings
 * @see {@link from} for Effect-wrapped creation
 */
export const Int256Schema: S.Schema<Int256Type, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  Int256TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Int256(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (int256) => ParseResult.succeed(int256)
  }
).annotations({ identifier: 'Int256Schema' })

/**
 * Effect Schema for parsing Int256 from hexadecimal strings.
 *
 * @description
 * Parses hexadecimal string representations of signed 256-bit integers.
 * Useful for parsing EVM-encoded signed integers from transaction data,
 * logs, or storage slots.
 *
 * @param input - A hex string (with or without 0x prefix)
 * @returns The validated Int256Type
 * @throws {ParseError} When the string is not valid hex or value is out of range
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Int256FromHexSchema } from 'voltaire-effect/Int256'
 *
 * // Parse from hex string (max Int256)
 * const int256 = S.decodeSync(Int256FromHexSchema)('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
 *
 * // Parse negative value (two's complement)
 * const negative = S.decodeSync(Int256FromHexSchema)('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') // -1
 * ```
 *
 * @since 0.0.1
 * @see {@link Int256Schema} for parsing from numbers/strings
 * @see {@link fromHex} for Effect-wrapped hex parsing
 */
export const Int256FromHexSchema: S.Schema<Int256Type, string> = S.transformOrFail(
  S.String,
  Int256TypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(BrandedInt256.fromHex(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (int256) => ParseResult.succeed(BrandedInt256.toHex(int256))
  }
).annotations({ identifier: 'Int256FromHexSchema' })
