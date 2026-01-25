import { Bytes32 } from '@tevm/voltaire/Bytes'
import { InvalidLengthError } from '@tevm/voltaire/errors'
import type { StorageValueType } from './StorageValueSchema.js'
import * as Effect from 'effect/Effect'

type StorageValueLike = StorageValueType | string | Uint8Array | bigint | number

export const from = (value: StorageValueLike): Effect.Effect<StorageValueType, InvalidLengthError | Error> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value) as StorageValueType,
    catch: (e) => e as InvalidLengthError | Error
  })

export const zero = (): StorageValueType => Bytes32.Bytes32(new Uint8Array(32)) as StorageValueType

export const fromBigInt = (value: bigint): Effect.Effect<StorageValueType, Error> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value) as StorageValueType,
    catch: (e) => e as Error
  })
