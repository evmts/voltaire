import { Proof } from '@tevm/voltaire'

type ProofType = Proof.ProofType
type ProofLike = Proof.ProofLike
import * as Effect from 'effect/Effect'

export const from = (value: ProofLike): Effect.Effect<ProofType, Error> =>
  Effect.try({
    try: () => Proof.from(value),
    catch: (e) => e as Error
  })
