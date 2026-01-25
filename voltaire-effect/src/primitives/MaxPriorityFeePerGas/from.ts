import { Uint } from '@tevm/voltaire'
import type { MaxPriorityFeePerGasType } from './MaxPriorityFeePerGasSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

export const from = (value: bigint | number | string): Effect.Effect<MaxPriorityFeePerGasType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as MaxPriorityFeePerGasType,
    catch: (e) => e as UintError
  })

const GWEI = 1_000_000_000n

export const fromGwei = (value: bigint | number): Effect.Effect<MaxPriorityFeePerGasType, Error> =>
  Effect.try({
    try: () => {
      const gwei = typeof value === 'number' ? BigInt(value) : value
      if (gwei < 0n) throw new Error('MaxPriorityFeePerGas cannot be negative')
      return (gwei * GWEI) as unknown as MaxPriorityFeePerGasType
    },
    catch: (e) => e as Error
  })

export const toGwei = (value: MaxPriorityFeePerGasType): bigint => value / GWEI
