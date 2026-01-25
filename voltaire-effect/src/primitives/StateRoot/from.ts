import { Bytes32 } from '@tevm/voltaire/Bytes'
import { InvalidLengthError } from '@tevm/voltaire/errors'
import type { StateRootType } from './StateRootSchema.js'
import * as Effect from 'effect/Effect'

type StateRootLike = StateRootType | string | Uint8Array | bigint | number

export const from = (value: StateRootLike): Effect.Effect<StateRootType, InvalidLengthError | Error> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value) as StateRootType,
    catch: (e) => e as InvalidLengthError | Error
  })

export const empty = (): StateRootType => Bytes32.Bytes32(new Uint8Array(32)) as StateRootType
