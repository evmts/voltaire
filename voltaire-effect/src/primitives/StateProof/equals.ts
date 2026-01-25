import { StateProof } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type StateProofType = StateProof.StateProofType

export const equals = (a: StateProofType, b: StateProofType): Effect.Effect<boolean, never> =>
  Effect.succeed(StateProof.equals(a, b))
