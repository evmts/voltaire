import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export type MaxFeePerGasType = bigint & { readonly __tag: 'MaxFeePerGas' }

const MaxFeePerGasTypeSchema = S.declare<MaxFeePerGasType>(
  (u): u is MaxFeePerGasType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'MaxFeePerGas' }
)

export const MaxFeePerGasSchema: S.Schema<MaxFeePerGasType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  MaxFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as MaxFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (maxFee) => ParseResult.succeed(maxFee)
  }
).annotations({ identifier: 'MaxFeePerGasSchema' })

const GWEI = 1_000_000_000n

export const MaxFeePerGasFromGweiSchema: S.Schema<MaxFeePerGasType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  MaxFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        const gwei = typeof value === 'number' ? BigInt(value) : value
        if (gwei < 0n) {
          return ParseResult.fail(new ParseResult.Type(ast, value, 'MaxFeePerGas cannot be negative'))
        }
        return ParseResult.succeed((gwei * GWEI) as unknown as MaxFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (maxFee) => ParseResult.succeed(maxFee / GWEI)
  }
).annotations({ identifier: 'MaxFeePerGasFromGweiSchema' })
