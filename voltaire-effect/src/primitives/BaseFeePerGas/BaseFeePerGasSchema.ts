import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export type BaseFeePerGasType = bigint & { readonly __tag: 'BaseFeePerGas' }

const BaseFeePerGasTypeSchema = S.declare<BaseFeePerGasType>(
  (u): u is BaseFeePerGasType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'BaseFeePerGas' }
)

export const BaseFeePerGasSchema: S.Schema<BaseFeePerGasType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  BaseFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as BaseFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (baseFee) => ParseResult.succeed(baseFee)
  }
).annotations({ identifier: 'BaseFeePerGasSchema' })

const GWEI = 1_000_000_000n

export const BaseFeePerGasFromGweiSchema: S.Schema<BaseFeePerGasType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  BaseFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        const gwei = typeof value === 'number' ? BigInt(value) : value
        if (gwei < 0n) {
          return ParseResult.fail(new ParseResult.Type(ast, value, 'BaseFeePerGas cannot be negative'))
        }
        return ParseResult.succeed((gwei * GWEI) as unknown as BaseFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (baseFee) => ParseResult.succeed(baseFee / GWEI)
  }
).annotations({ identifier: 'BaseFeePerGasFromGweiSchema' })
