import { Uint } from '@tevm/voltaire'
import type { MaxFeePerGasType } from './MaxFeePerGasSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

export const from = (value: bigint | number | string): Effect.Effect<MaxFeePerGasType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as MaxFeePerGasType,
    catch: (e) => e as UintError
  })

const GWEI = 1_000_000_000n

export const fromGwei = (value: bigint | number): Effect.Effect<MaxFeePerGasType, Error> =>
  Effect.try({
    try: () => {
      const gwei = typeof value === 'number' ? BigInt(value) : value
      if (gwei < 0n) throw new Error('MaxFeePerGas cannot be negative')
      return (gwei * GWEI) as unknown as MaxFeePerGasType
    },
    catch: (e) => e as Error
  })

export const toGwei = (value: MaxFeePerGasType): bigint => value / GWEI
