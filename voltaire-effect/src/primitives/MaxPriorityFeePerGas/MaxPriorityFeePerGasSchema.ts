import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export type MaxPriorityFeePerGasType = bigint & { readonly __tag: 'MaxPriorityFeePerGas' }

const MaxPriorityFeePerGasTypeSchema = S.declare<MaxPriorityFeePerGasType>(
  (u): u is MaxPriorityFeePerGasType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'MaxPriorityFeePerGas' }
)

export const MaxPriorityFeePerGasSchema: S.Schema<MaxPriorityFeePerGasType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  MaxPriorityFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as MaxPriorityFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (maxPriorityFee) => ParseResult.succeed(maxPriorityFee)
  }
).annotations({ identifier: 'MaxPriorityFeePerGasSchema' })

const GWEI = 1_000_000_000n

export const MaxPriorityFeePerGasFromGweiSchema: S.Schema<MaxPriorityFeePerGasType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  MaxPriorityFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        const gwei = typeof value === 'number' ? BigInt(value) : value
        if (gwei < 0n) {
          return ParseResult.fail(new ParseResult.Type(ast, value, 'MaxPriorityFeePerGas cannot be negative'))
        }
        return ParseResult.succeed((gwei * GWEI) as unknown as MaxPriorityFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (maxPriorityFee) => ParseResult.succeed(maxPriorityFee / GWEI)
  }
).annotations({ identifier: 'MaxPriorityFeePerGasFromGweiSchema' })
