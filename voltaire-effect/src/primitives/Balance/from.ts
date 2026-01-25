import { Uint } from '@tevm/voltaire'
import type { BalanceType } from './BalanceSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

export const from = (value: bigint | number | string): Effect.Effect<BalanceType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as BalanceType,
    catch: (e) => e as UintError
  })
