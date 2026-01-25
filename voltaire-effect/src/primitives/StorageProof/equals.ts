import { StorageProof } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type StorageProofType = StorageProof.StorageProofType

export const equals = (a: StorageProofType, b: StorageProofType): Effect.Effect<boolean, never> =>
  Effect.succeed(StorageProof.equals(a, b))
