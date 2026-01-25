import { Uint } from '@tevm/voltaire'
import type { BaseFeePerGasType } from './BaseFeePerGasSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

export const from = (value: bigint | number | string): Effect.Effect<BaseFeePerGasType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as BaseFeePerGasType,
    catch: (e) => e as UintError
  })

const GWEI = 1_000_000_000n

export const fromGwei = (value: bigint | number): Effect.Effect<BaseFeePerGasType, Error> =>
  Effect.try({
    try: () => {
      const gwei = typeof value === 'number' ? BigInt(value) : value
      if (gwei < 0n) throw new Error('BaseFeePerGas cannot be negative')
      return (gwei * GWEI) as unknown as BaseFeePerGasType
    },
    catch: (e) => e as Error
  })

export const toGwei = (value: BaseFeePerGasType): bigint => value / GWEI
