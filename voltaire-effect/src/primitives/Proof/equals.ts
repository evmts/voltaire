import { Proof } from '@tevm/voltaire'

type ProofType = Proof.ProofType
import * as Effect from 'effect/Effect'

export const equals = (a: ProofType, b: ProofType): Effect.Effect<boolean, never> =>
  Effect.succeed(Proof.equals(a, b))
