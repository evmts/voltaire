import { StateProof } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type StateProofType = StateProof.StateProofType
type StateProofLike = StateProof.StateProofLike

export const from = (value: StateProofLike): Effect.Effect<StateProofType, Error> =>
  Effect.try({
    try: () => StateProof.from(value),
    catch: (e) => e as Error
  })
