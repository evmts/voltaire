import { Uint256, isUint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Schema from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Internal schema declaration for Uint256 type validation.
 * @since 0.0.1
 */
const Uint256TypeSchema = Schema.declare<Uint256Type>(
  (u): u is Uint256Type => isUint256(u),
  { identifier: 'Uint256' }
)

/**
 * Effect Schema for validating and transforming 256-bit unsigned integers.
 * 
 * Accepts bigint, number, or string inputs and validates against Uint256 constraints.
 * 
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { UintSchema } from './UintSchema.js'
 * 
 * const value = S.decodeSync(UintSchema)('1000000000000000000')
 * const fromBigInt = S.decodeSync(UintSchema)(1000000000000000000n)
 * ```
 * 
 * @since 0.0.1
 */
export const UintSchema: Schema.Schema<Uint256Type, bigint | number | string> = Schema.transformOrFail(
  Schema.Union(Schema.BigIntFromSelf, Schema.Number, Schema.String),
  Uint256TypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint256.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (uint) => ParseResult.succeed(Uint256.toBigInt(uint))
  }
)

/**
 * Effect Schema for validating Uint256 from hex strings.
 * 
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { UintFromHexSchema } from './UintSchema.js'
 * 
 * const value = S.decodeSync(UintFromHexSchema)('0xde0b6b3a7640000')
 * ```
 * 
 * @since 0.0.1
 */
export const UintFromHexSchema: Schema.Schema<Uint256Type, string> = Schema.transformOrFail(
  Schema.String,
  Uint256TypeSchema,
  {
    strict: true,
    decode: (hex, _options, ast) => {
      try {
        return ParseResult.succeed(Uint256.fromHex(hex))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, hex, (e as Error).message))
      }
    },
    encode: (uint) => ParseResult.succeed(Uint256.toHex(uint))
  }
)

/**
 * Effect Schema for validating Uint256 from bytes.
 * 
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { UintFromBytesSchema } from './UintSchema.js'
 * 
 * const value = S.decodeSync(UintFromBytesSchema)(bytes32)
 * ```
 * 
 * @since 0.0.1
 */
export const UintFromBytesSchema: Schema.Schema<Uint256Type, Uint8Array> = Schema.transformOrFail(
  Schema.Uint8ArrayFromSelf,
  Uint256TypeSchema,
  {
    strict: true,
    decode: (bytes, _options, ast) => {
      try {
        return ParseResult.succeed(Uint256.fromBytes(bytes))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, bytes, (e as Error).message))
      }
    },
    encode: (uint) => ParseResult.succeed(Uint256.toBytes(uint))
  }
)
