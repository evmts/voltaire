import * as Effect from 'effect/Effect'
import type { FeeOracleInput, FeeOracleType } from './FeeOracleSchema.js'

export class FeeOracleError extends Error {
  readonly _tag = 'FeeOracleError'
  constructor(message: string) {
    super(message)
    this.name = 'FeeOracleError'
  }
}

export const from = (input: FeeOracleInput): Effect.Effect<FeeOracleType, FeeOracleError> =>
  Effect.try({
    try: () => {
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
      return result
    },
    catch: (e) => new FeeOracleError((e as Error).message)
  })

export const validate = (fee: FeeOracleType): Effect.Effect<void, FeeOracleError> =>
  Effect.try({
    try: () => {
      if (fee.baseFee < 0n) throw new Error('baseFee must be non-negative')
      if (fee.priorityFee < 0n) throw new Error('priorityFee must be non-negative')
      if (fee.maxFee < 0n) throw new Error('maxFee must be non-negative')
      if (fee.maxFee < fee.baseFee + fee.priorityFee) {
        throw new Error('maxFee must be >= baseFee + priorityFee')
      }
    },
    catch: (e) => new FeeOracleError((e as Error).message)
  })

export const effectiveGasPrice = (
  fee: FeeOracleType
): Effect.Effect<bigint, never> => {
  const effective = fee.baseFee + fee.priorityFee
  return Effect.succeed(effective > fee.maxFee ? fee.maxFee : effective)
}

export const withMultiplier = (
  fee: FeeOracleType,
  multiplier: number
): Effect.Effect<FeeOracleType, FeeOracleError> =>
  Effect.try({
    try: () => ({
      ...fee,
      maxFee: BigInt(Math.floor(Number(fee.maxFee) * multiplier)),
      priorityFee: BigInt(Math.floor(Number(fee.priorityFee) * multiplier)),
    }),
    catch: (e) => new FeeOracleError((e as Error).message)
  })
