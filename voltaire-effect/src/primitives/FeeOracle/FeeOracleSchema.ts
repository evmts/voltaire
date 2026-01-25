import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export type FeeOracleType = {
  readonly baseFee: bigint
  readonly priorityFee: bigint
  readonly maxFee: bigint
  readonly gasPrice?: bigint
  readonly estimatedTime?: number
}

const FeeOracleTypeSchema = S.declare<FeeOracleType>(
  (u): u is FeeOracleType =>
    u !== null &&
    typeof u === 'object' &&
    'baseFee' in u &&
    'priorityFee' in u &&
    'maxFee' in u,
  { identifier: 'FeeOracle' }
)

export type FeeOracleInput = {
  readonly baseFee: bigint | number | string
  readonly priorityFee: bigint | number | string
  readonly maxFee: bigint | number | string
  readonly gasPrice?: bigint | number | string
  readonly estimatedTime?: number
}

export const FeeOracleSchema: S.Schema<FeeOracleType, FeeOracleInput> = S.transformOrFail(
  S.Struct({
    baseFee: S.Union(S.BigIntFromSelf, S.Number, S.String),
    priorityFee: S.Union(S.BigIntFromSelf, S.Number, S.String),
    maxFee: S.Union(S.BigIntFromSelf, S.Number, S.String),
    gasPrice: S.optional(S.Union(S.BigIntFromSelf, S.Number, S.String)),
    estimatedTime: S.optional(S.Number),
  }),
  FeeOracleTypeSchema,
  {
    strict: true,
    decode: (input, _options, ast) => {
      try {
        const result: FeeOracleType = {
          baseFee: BigInt(input.baseFee),
          priorityFee: BigInt(input.priorityFee),
          maxFee: BigInt(input.maxFee),
        }
        if (input.gasPrice !== undefined) {
          (result as any).gasPrice = BigInt(input.gasPrice)
        }
        if (input.estimatedTime !== undefined) {
          (result as any).estimatedTime = input.estimatedTime
        }
        return ParseResult.succeed(result)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message))
      }
    },
    encode: (state) => ParseResult.succeed({
      baseFee: state.baseFee,
      priorityFee: state.priorityFee,
      maxFee: state.maxFee,
      gasPrice: state.gasPrice,
      estimatedTime: state.estimatedTime,
    })
  }
).annotations({ identifier: 'FeeOracleSchema' })
